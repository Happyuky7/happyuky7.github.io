Something fairly absurd happened to me with ChatGPT recently. I opened it like any other day and got the invitation to try **Work** with the usual **"Try Work"** button. To be clear: I know what Work is and I'd already used it. I clicked mostly thinking *"let's see if they've put something new into Work"*.

My thinking was simple: *"Sure, it'll take me to Work, I'll see what's new and then go back to the usual ChatGPT"*. Like so many other new features. It never crossed my mind that one click could complicate something as basic as starting a normal conversation.

But when I tried to go back, I got a surprise: **ChatGPT kept opening in Work and the selector for switching between Chat and Work was gone**. The very option I expected to use to undo the change had apparently vanished.

I wasn't trying to make Work my default way of using ChatGPT. I just wanted to see what was new in it. So I started digging into how to get the normal interface back, and collected these alternatives in case it happens to someone else.

> **Note:** the community solutions below are *workarounds*, not guaranteed official fixes. The ChatGPT interface changes often, and some of these only work on the web or only in the desktop app.

## What is ChatGPT Work and why does it look different?

ChatGPT has two distinct experiences: **Chat**, for conversation, questions and using the assistant the usual way, and **Work**, aimed at longer tasks that take several steps. **Codex** is yet another experience, focused on coding.

It's not that Work is bad. I just don't want to use it for everything. If I come in to ask a quick question, I should be able to start a normal chat without fighting the interface.

According to [OpenAI's documentation on ChatGPT Work and Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex), in the desktop app you should be able to select **ChatGPT** and then pick **Chat** or **Work**. The trouble starts when that selector isn't where it should be.

## Solution 1: open the normal Chat straight from a URL (web)

The simplest alternative I found for the web version comes from a [Reddit thread about getting back to Chat instead of Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

It is a matter of opening this address:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

One user explained that this route took them straight into the normal **Chat** experience, even after having been in Work. They also mentioned that going in this way, the Chat/Work selector might not show up — but in that case because the route itself was forcing the Chat view.

If it works for you, you can bookmark it and use it to open ChatGPT the usual way.

**Important:** `/bot` is an alternative entry point shared by the community, not a documented official option for resetting your account's default mode. It may stop working or behave differently in future versions. And **going in through that URL doesn't necessarily mean you've got the selector back**.

## Solution 2: go through Codex and come back to ChatGPT (desktop app)

If the problem shows up in the ChatGPT desktop app, there's another method reported by users who lost the **Chat/Work** selector:

1. Open the app menu and switch from **ChatGPT** to **Codex**.
2. Create a **new chat** in Codex.
3. Switch back from **Codex** to **ChatGPT**.
4. Create another **new chat**.
5. Check whether the **Chat / Work** selector is back and pick **Chat**.

This sequence was described by a user in [issue #49233 of the Codex repository](https://github.com/openai/codex/issues/49233), who said it brought the selector back on Windows after other attempts had failed.

That doesn't make it an official fix, nor does it mean it will work in every version, but it makes more sense to try it than to reinstall everything without knowing whether that helps.

## Solution 3: sign out and sign back in

Another report, [issue #48700](https://github.com/openai/codex/issues/48700), says that **explicitly signing out** of the Windows app and signing back in restored Chat mode and its selector.

There are also users for whom signing out, restarting or reinstalling fixed **nothing**. So I'd treat it as an easy thing to try, not a sure thing.

Before clearing cookies or local data, just try signing out and authenticating again. If you're on the web, you can also check whether the problem happens in another browser session — though that's no guarantee your account setting will be corrected.

## What about the Tampermonkey script that defaults to Chat?

That same Reddit thread shared a [userscript called "ChatGPT Default to Chat"](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184), meant for managers like Tampermonkey.

How it works is pretty direct: **it looks for the Chat button on the page and, if it is there and not selected, tries to click it automatically**. It's a way of automating an interface action, not of changing an internal account setting.

And here's the important detail: **if the selector or the Chat button doesn't exist in that view, the script has nothing to click**. So it can help people who still see the selector but keep landing in Work, and not necessarily people who lost it entirely.

On top of that, it's third-party code running in your browser. If you decide to use it, review the code and its permissions before installing. I wouldn't reach for it first when trying a URL is enough.

## Does this mean my account is locked into Work?

Not necessarily. The interface opening in Work, or the selector being gone, **doesn't prove** that a permanent setting was changed on OpenAI's servers. It could be an interface, session, app version or feature rollout issue. From the outside there's no way to know the exact cause for any given account.

You also shouldn't assume old chats were damaged or lost. OpenAI explains that Chat and Work conversations can appear together under **Recents**. The clearest way to check whether normal behaviour is back is to **create a new chat** and see which mode it opens in.

## If nothing works: report it to OpenAI

If you're still stuck in Work, you can reach support at [**https://help.openai.com/**](https://help.openai.com/) using the chat icon in the lower-right corner.

It's best to explain what action triggered the problem, which device it happens on, and what you've already tried. For example:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Don't share passwords, access codes or sensitive information in the report.

## Conclusion

All of this started because I pressed **"Try Work"** to see what was new in Work, a tool I already knew and had used. I expected the usual: go in, check what was new, and go back to Chat whenever I wanted.

The frustrating part wasn't Work itself — it was finding myself without an obvious way back to **Chat**, which is what I wanted to use in the first place.

If the same thing happened to you, I'd start with **`https://chatgpt.com/bot` if you're on the web**, or with **switching to Codex and back to ChatGPT if you're in the desktop app**. They are different paths for different situations, and neither should be mistaken for a definitive fix from OpenAI.

Hopefully the option to return to normal Chat will always be visible, and we won't have to hunt for tricks on Reddit for something this basic.

---

### Sources and references

- [Official documentation: ChatGPT Work and Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: getting the selector back by switching through Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: missing selector on Windows](https://github.com/openai/codex/issues/48700)
- [Help Center: how to contact support](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
