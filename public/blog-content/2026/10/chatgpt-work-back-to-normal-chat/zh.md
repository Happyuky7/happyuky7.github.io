最近我在 ChatGPT 上遇到了一件挺荒唐的事。我像往常一样打开它，跳出了试用 **Work** 的邀请，还有那个典型的 **“Try Work”** 按钮。先说明一下：我知道 Work 是什么，之前也用过。我点下去，更多是想 *“看看他们是不是在 Work 里加了什么新东西”*。

当时的想法很简单：*“好吧，它会带我去 Work，我看看有什么新东西，然后再回到平常的 ChatGPT”*。就像很多新功能那样。我没想到这一下点击会让“开始一次普通对话”这么基本的事变得复杂。

可当我想回去时，却碰到了意外：**ChatGPT 一直以 Work 打开，而在 Chat 和 Work 之间切换的选择器不见了**。也就是说，我本打算用来撤销这次更改的那个选项，好像凭空消失了。

我并不是想把 Work 设为我使用 ChatGPT 的常规方式。我只是想看看有什么新变化。于是我开始研究怎么找回普通界面，并整理了这些办法，以防别人也遇到。

> **注意：** 这里列出的社区方案都是*变通办法*，不是有保证的官方修复。ChatGPT 的界面经常变化，有些办法只在网页版有效，有些只在桌面应用有效。

## 什么是 ChatGPT Work，为什么看起来不一样？

ChatGPT 有两种不同的体验：**Chat**，用于聊天、提问以及按照惯常方式使用助手；**Work**，面向需要多个步骤的较长任务。**Codex** 则是另一种体验，专注于编程。

并不是说 Work 不好。我只是不想什么事都用它。如果我进来只是问一个简单的问题，那么理应可以直接开始一次普通对话，而不用跟界面较劲。

根据 [OpenAI 关于 ChatGPT Work 和 Codex 的文档](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)，在桌面应用中应该可以先选择 **ChatGPT**，再选择 **Chat** 或 **Work**。问题就出在这个选择器不在它该在的位置时。

## 方案一：直接用网址打开普通 Chat（网页版）

我为网页版找到的最简单办法来自一个 [关于如何回到 Chat 而不是 Work 的 Reddit 讨论串](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)。

做法就是打开这个地址：

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

一位用户说明，即使之前一直在用 Work，这条路径也能让他直接进入普通的 **Chat** 体验。他还提到，这样进入时 Chat/Work 选择器可能不显示，但那是因为该路径本身强制进入了 Chat 视图。

如果对你有效，可以把它加入书签，用来像以前那样打开 ChatGPT。

**重要：** `/bot` 是社区分享的替代入口，并不是官方文档中用于重置账户默认模式的选项。它在未来版本中可能失效或表现不同。而且 **通过这个网址进入，并不一定意味着你把选择器找回来了**。

## 方案二：先切到 Codex，再切回 ChatGPT（桌面应用）

如果问题出现在 ChatGPT 桌面应用，还有一种由丢失 **Chat/Work** 选择器的用户报告的方法：

1. 打开应用菜单，从 **ChatGPT** 切换到 **Codex**。
2. 在 Codex 中新建一个**对话**。
3. 再从 **Codex** 切换回 **ChatGPT**。
4. 再新建一个**对话**。
5. 查看 **Chat / Work** 选择器是否重新出现，并选择 **Chat**。

这一步骤由一位用户在 [Codex 仓库的 issue #49233](https://github.com/openai/codex/issues/49233) 中描述，他表示在其他尝试都无效之后，这样在 Windows 上让选择器回来了。

这并不代表它是官方修复，也不代表在所有版本都有效，但比起不知道有没有用就把所有东西重装一遍，试一试更合理。

## 方案三：退出登录再重新登录

另一份报告，[issue #48700](https://github.com/openai/codex/issues/48700)，提到在 Windows 应用中**明确退出登录**再重新登录，恢复了 Chat 模式及其选择器。

但也有用户表示，退出登录、重启或重装都**没有**解决任何问题。所以我会把它当作一个简单的尝试，而不是万无一失的办法。

在清除 Cookie 或本地数据之前，先单纯试试退出登录再重新验证。如果你用的是网页版，也可以看看在另一个浏览器会话中是否同样出现问题，不过这并不能保证账户设置会被纠正。

## 那个把 Chat 设为默认的 Tampermonkey 脚本呢？

在同一个 Reddit 讨论串里，有人分享了一个面向 Tampermonkey 这类管理器的 [名为 “ChatGPT Default to Chat” 的用户脚本](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)。

它的原理相当直接：**在页面上寻找 Chat 按钮，如果按钮存在且未被选中，就尝试自动点击它**。这是在自动化界面上的一个动作，而不是修改账户的内部设置。

关键细节在这里：**如果该视图中根本不存在选择器或 Chat 按钮，脚本就没有东西可点**。因此，它可能对仍能看到选择器、但启动时又回到 Work 的人有用，对完全失去选择器的人则未必。

另外，这是在你浏览器中运行的第三方代码。如果决定使用，请在安装前检查代码及其权限。既然试一个网址就够了，我不会把它当成首选方案。

## 这是否意味着我的账户被锁死在 Work 了？

不一定。界面以 Work 打开，或者选择器消失，**并不能证明** OpenAI 服务器上更改了某项永久设置。这可能是界面、会话、应用版本或功能灰度发布的问题。从外部无法得知每个账户的确切原因。

也不必认为旧的对话受损或丢失了。OpenAI 说明，Chat 与 Work 的对话可能会一起出现在**最近**中。想确认是否恢复了正常行为，最清楚的做法是**新建一个对话**，看看它以哪种模式打开。

## 如果都不奏效：向 OpenAI 反馈

如果你仍然被困在 Work 中，可以通过 [**https://help.openai.com/**](https://help.openai.com/) 右下角的聊天图标联系支持团队。

最好说明是哪个操作触发了问题、在什么设备上发生，以及你已经尝试过哪些办法。例如：

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

不要在反馈中提供密码、访问码或敏感信息。

## 结语

这一切的起点，只是我想看看已经熟悉、也用过的 Work 里有什么新东西，于是按下了 **“Try Work”**。我以为会和平常一样：进去、看看新东西，想回 Chat 时就回来。

让人沮丧的不是 Work 本身，而是发现自己找不到一条明显的路回到 **Chat**——那才是我一开始想用的东西。

如果你也遇到了同样的情况，我会**先试网页版的 `https://chatgpt.com/bot`**，或者在**桌面应用里切到 Codex 再切回 ChatGPT**。这是针对不同情况的不同路径，而且都不该被当作 OpenAI 的最终修复。

希望回到普通 Chat 的选项能一直可见，不必为了这么基础的事去 Reddit 上找窍门。

---

### 来源与参考

- [官方文档：ChatGPT Work 与 Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit：Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist：ChatGPT Default to Chat（用户脚本）](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233：通过 Codex 找回选择器](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700：Windows 上缺少选择器](https://github.com/openai/codex/issues/48700)
- [帮助中心：如何联系支持](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
