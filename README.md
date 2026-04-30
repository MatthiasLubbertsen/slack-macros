<!-- copilot: style with markdown -->
# slack macros (slam)

slack macros (slam for short) helps you with things that take some time. think of:
* translating a message
* asking ai for an answer
* telling users that they need patience for their orders in help channels
* and more!

with an average of 40% less text and more convenience, you can now send messages and get things done way faster.

## usage

try it out in `#slack-macros` with `/slam` or `@slack macros` (for threads) with one of these arguments:
* `hi` - post a silly message as you
* `tl` - translate your message to english and post it as you
* `ai` - get an answer from ai

> **note:** for now, you will have to delete the macro message yourself if you are in threads. this is something i could not complete in time.

## roadmap & to-do

because flavortown ends in 10hrs, i could not fully finish slack macros. this is the to-do list for `#beest`:
- [ ] `@slack macros` macro deletion (oauth)
- [ ] send as real user (oauth)
- [ ] support for options like `-q` (for quiet)
- [ ] better website
- [ ] easier function adding

*i will make the mention `@slam` tomorrow! i could not find that setting :(*

## behind the scenes

i made this project 90% without ai, but unfortunately, i could not finish it on time, so i used ai for the last 10%

head over to [slack-macros.matthiaslubbertsen.workers.dev](https://slack-macros.matthiaslubbertsen.workers.dev) to see all macros!

make a pr to [matthiaslubbertsen/slack-macros](https://github.com/MatthiasLubbertsen/slack-macros) to add your own macro (probably with a function?) using this file as a template