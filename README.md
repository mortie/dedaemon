# DEDaemon

DEDaemon is a daemon to give some of the perks of a full desktop environment to
those of us running window managers.

## Installation

Run `npm install -g dedaemon` as root.

## Usage

`dedaemon <config file>`

e.g:

`dedaemon ~/.config/dedaemon.hcnf`

You probably want to run that on startup. If you're running i3wm, that means
adding `exec --no-startup-id dedaemon ~/.config/dedaemon.hcnf` to
`~/.i3/config`.

## Configuration

There will be stuff here later.
