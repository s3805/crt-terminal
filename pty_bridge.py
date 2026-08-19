#!/usr/bin/env python3
"""
CRT-1990 PTY bridge.
Allocates a real pseudo-terminal via pty.fork(), runs an interactive login
shell on it, and proxies I/O between the parent process and the terminal.
A side channel (fd 3) accepts "ROWS COLS\\n" lines to resize the PTY via
TIOCSWINSZ, so the terminal can reflow live (vim / less / zsh line editor
stay in sync with the viewport).
"""
import os
import sys
import pty
import select
import fcntl
import termios
import signal
import struct

DEBUG = os.environ.get("PTY_DEBUG") == "1"
SHELL = os.environ.get("SHELL", "/bin/bash")
COLS = int(os.environ.get("INIT_COLS", "80"))
ROWS = int(os.environ.get("INIT_ROWS", "24"))
CTRL_FD = 3  # resize control channel (parent -> child)


def dbg(msg):
    if DEBUG:
        sys.stderr.write("[bridge] " + msg + "\n")
        sys.stderr.flush()


# pty.fork() sets up the slave as the child's controlling terminal (stdin/
# stdout/stderr) the way login shells (including zsh) expect.
pid, master_fd = pty.fork()

if pid == 0:
    # Child: already has the pty as controlling terminal (0,1,2)
    env = dict(os.environ)
    env["TERM"] = "xterm-256color"
    dbg("child exec " + SHELL)
    os.execvpe(SHELL, [SHELL, "-i"], env)
    os._exit(127)

# Parent
stdin_fd = sys.stdin.fileno()
stdout_fd = sys.stdout.fileno()


def set_winsize(rows, cols):
    try:
        fcntl.ioctl(master_fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
    except OSError:
        pass


# Apply the initial window size before the shell prints anything
set_winsize(ROWS, COLS)

try:
    while True:
        r, _, _ = select.select([master_fd, stdin_fd, CTRL_FD], [], [])
        if DEBUG:
            dbg("select -> " + repr(r))
        if master_fd in r:
            try:
                data = os.read(master_fd, 65536)
            except OSError:
                break
            if not data:
                break
            if DEBUG:
                dbg("master -> %d bytes" % len(data))
            os.write(stdout_fd, data)
        if stdin_fd in r:
            try:
                data = os.read(stdin_fd, 65536)
            except OSError:
                break
            if not data:
                break
            os.write(master_fd, data)
        if CTRL_FD in r:
            try:
                line = os.read(CTRL_FD, 256)
            except OSError:
                line = b""
            if not line:
                continue
            try:
                parts = line.decode().split()
                if len(parts) == 2:
                    set_winsize(int(parts[0]), int(parts[1]))
            except (ValueError, OSError):
                pass
except (OSError, ValueError):
    pass
finally:
    try:
        os.close(master_fd)
    except OSError:
        pass
    try:
        os.kill(pid, signal.SIGTERM)
    except OSError:
        pass
