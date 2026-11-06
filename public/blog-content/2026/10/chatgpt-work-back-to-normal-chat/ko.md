얼마 전 ChatGPT에서 꽤 황당한 일이 있었습니다. 평소처럼 들어갔더니 **Work**를 사용해 보라는 안내와 함께 익숙한 **「Try Work」** 버튼이 떴습니다. 미리 말해 두자면, Work가 뭔지 알고 있고 이미 써 본 적도 있습니다. 누른 건 *「Work에 뭔가 새로운 게 들어갔나 볼까」* 하는 마음이었습니다.

생각은 아주 단순했습니다. *「아, 그래. Work로 넘어가겠지. 뭐가 새로워졌는지 보고 원래 ChatGPT로 돌아오면 되지」*. 새로운 기능에서 흔히 그러듯이요. 그 클릭 하나가 일반 대화를 시작하는 것만큼 기본적인 일을 복잡하게 만들 줄은 몰랐습니다.

그런데 돌아가려 하자 뜻밖의 상황이 벌어졌습니다. **ChatGPT가 계속 Work로 열렸고, Chat과 Work를 전환하는 선택기가 더는 보이지 않았습니다**. 변경을 되돌리려고 쓰려던 바로 그 옵션이 사라져 버린 셈입니다.

저는 Work를 ChatGPT의 기본 사용 방식으로 켜려던 게 아니었습니다. 그저 뭐가 새로워졌는지 보고 싶었을 뿐입니다. 그래서 일반 인터페이스를 되찾는 방법을 찾아보고, 같은 일을 겪는 사람을 위해 다음 방법들을 모았습니다.

> **참고:** 여기 소개하는 커뮤니티의 해법은 *우회 방법*이며, 보장된 공식 수정이 아닙니다. ChatGPT 인터페이스는 자주 바뀌고, 일부는 웹에서만 또는 데스크톱 앱에서만 통합니다.

## ChatGPT Work란 무엇이고 왜 달라 보일까

ChatGPT에는 서로 다른 두 가지 경험이 있습니다. 대화하고 질문하며 평소처럼 어시스턴트를 쓰는 **Chat**, 그리고 여러 단계를 거치는 긴 작업에 맞춘 **Work**입니다. **Codex**는 또 다른 경험으로, 프로그래밍에 초점이 맞춰져 있습니다.

Work가 나쁘다는 말이 아닙니다. 다만 모든 일에 그걸 쓰고 싶지는 않다는 뜻입니다. 짧은 질문 하나 하러 들어왔다면, 인터페이스와 씨름하지 않고 일반 대화를 시작할 수 있어야 자연스럽겠죠.

[ChatGPT Work와 Codex에 관한 OpenAI 문서](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)에 따르면, 데스크톱 앱에서는 **ChatGPT**를 선택한 뒤 **Chat** 또는 **Work**를 고를 수 있어야 합니다. 문제는 그 선택기가 있어야 할 자리에 없을 때 시작됩니다.

## 해결책 1: URL로 일반 Chat 바로 열기 (웹)

웹 버전에서 찾은 가장 간단한 방법은 [Work 대신 Chat으로 돌아가는 법을 다룬 레딧 스레드](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)에서 나왔습니다.

이 주소를 여는 것입니다:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

한 사용자는 직전까지 Work를 쓰고 있었더라도 이 경로로는 일반 **Chat** 경험에 바로 들어갈 수 있었다고 설명했습니다. 또 이렇게 들어가면 Chat/Work 선택기가 보이지 않을 수 있는데, 그건 경로 자체가 Chat 화면을 강제하기 때문이라고도 했습니다.

효과가 있다면 즐겨찾기에 저장해 두고 평소처럼 ChatGPT를 여는 데 쓰면 됩니다.

**중요:** `/bot`은 커뮤니티가 공유한 대체 입구일 뿐, 계정의 기본 모드를 되돌리기 위한 공식 문서상의 옵션이 아닙니다. 향후 버전에서 작동을 멈추거나 다르게 동작할 수 있습니다. 그리고 **이 URL로 들어갔다고 해서 선택기를 되찾았다는 뜻은 아닙니다**.

## 해결책 2: Codex를 거쳐 ChatGPT로 돌아오기 (데스크톱 앱)

문제가 ChatGPT 데스크톱 앱에서 나타난다면, **Chat/Work** 선택기를 잃은 사용자들이 보고한 또 다른 방법이 있습니다.

1. 앱 메뉴를 열고 **ChatGPT**에서 **Codex**로 전환합니다.
2. Codex에서 **새 대화**를 만듭니다.
3. 다시 **Codex**에서 **ChatGPT**로 전환합니다.
4. **새 대화**를 하나 더 만듭니다.
5. **Chat / Work** 선택기가 다시 보이는지 확인하고 **Chat**을 고릅니다.

이 순서는 한 사용자가 [Codex 저장소의 issue #49233](https://github.com/openai/codex/issues/49233)에서 설명한 것으로, 다른 시도가 통하지 않은 뒤 Windows에서 선택기를 되살렸다고 합니다.

공식 수정이라는 뜻도, 모든 버전에서 통한다는 보장도 아니지만, 도움이 될지도 모르는 채로 전부 다시 설치하는 것보다는 시도해 볼 만합니다.

## 해결책 3: 로그아웃했다가 다시 로그인하기

또 다른 보고인 [issue #48700](https://github.com/openai/codex/issues/48700)에서는 Windows 앱에서 **명시적으로 로그아웃**한 뒤 다시 로그인하자 Chat 모드와 선택기가 복구되었다고 합니다.

반대로 로그아웃도, 재시작도, 재설치도 **아무것도** 해결해 주지 않은 사용자도 있습니다. 그래서 저는 이를 간단한 시도로 볼 뿐, 확실한 해법으로 여기지는 않습니다.

쿠키나 로컬 데이터를 지우기 전에, 우선 로그아웃하고 다시 인증해 보세요. 웹을 쓴다면 다른 브라우저 세션에서도 같은 문제가 생기는지 확인해 볼 수 있지만, 그렇다고 계정 설정이 고쳐진다는 보장은 없습니다.

## Chat을 기본으로 만드는 Tampermonkey 스크립트는?

같은 레딧 스레드에서는 Tampermonkey 같은 관리자를 위한 [「ChatGPT Default to Chat」이라는 유저스크립트](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)도 공유되었습니다.

작동 방식은 꽤 직접적입니다. **페이지에서 Chat 버튼을 찾아, 존재하고 선택되어 있지 않다면 자동으로 클릭을 시도합니다**. 계정 내부 설정을 바꾸는 게 아니라 인터페이스 동작을 자동화하는 방식입니다.

여기서 중요한 점은 이것입니다. **그 화면에 선택기나 Chat 버튼이 아예 없다면, 스크립트는 클릭할 대상이 없습니다**. 따라서 선택기는 보이지만 시작할 때마다 Work로 돌아가는 사람에게는 유용할 수 있어도, 선택기를 완전히 잃은 사람에게는 꼭 그렇지 않습니다.

게다가 브라우저에서 실행되는 서드파티 코드입니다. 사용하기로 했다면 설치 전에 코드와 권한을 확인하세요. URL 하나 시도해 보면 되는 상황에서 저라면 이걸 첫 번째 해법으로 두지는 않겠습니다.

## 그럼 제 계정이 Work에 묶인 건가요?

꼭 그렇지는 않습니다. 인터페이스가 Work로 열리거나 선택기가 사라졌다는 사실이 OpenAI 서버에서 영구적인 설정이 바뀌었음을 **증명하지는 않습니다**. 인터페이스, 세션, 앱 버전, 기능 배포 상황의 문제일 수 있습니다. 바깥에서는 각 계정의 정확한 원인을 알 수 없습니다.

예전 대화가 손상되거나 사라졌다고 가정할 필요도 없습니다. OpenAI는 Chat과 Work의 대화가 **최근 항목**에 함께 표시될 수 있다고 설명합니다. 정상 동작이 돌아왔는지 확인하는 가장 확실한 방법은 **새 대화를 만들어** 어떤 모드로 열리는지 보는 것입니다.

## 아무것도 통하지 않는다면: OpenAI에 신고하기

여전히 Work에 갇혀 있다면 [**https://help.openai.com/**](https://help.openai.com/)의 오른쪽 아래 채팅 아이콘으로 지원팀에 연락할 수 있습니다.

어떤 동작이 문제를 일으켰는지, 어떤 기기에서 발생하는지, 이미 무엇을 시도했는지 설명하는 것이 가장 좋습니다. 예를 들면:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

신고에 비밀번호, 접근 코드, 민감한 정보를 적지 마세요.

## 마무리

이 모든 일은 이미 알고 써 본 적도 있는 Work에 뭐가 새로 들어갔는지 보려고 **「Try Work」**를 누른 데서 시작됐습니다. 평소처럼 들어가서 새로운 부분을 보고, 원할 때 Chat으로 돌아올 수 있을 거라고 기대했습니다.

답답했던 건 Work 자체가 아니라, 처음부터 쓰고 싶었던 **Chat**으로 돌아갈 뚜렷한 길이 보이지 않았다는 점입니다.

같은 일을 겪었다면 저는 **웹이라면 `https://chatgpt.com/bot`**, **데스크톱 앱이라면 Codex로 전환했다가 ChatGPT로 돌아오는 방법**부터 시작하겠습니다. 서로 다른 상황을 위한 서로 다른 경로이며, 어느 쪽도 OpenAI의 확정적인 수정과 혼동해서는 안 됩니다.

일반 Chat으로 돌아가는 선택지가 늘 보이도록 남아서, 이런 기본적인 일로 레딧에서 요령을 찾지 않아도 되기를 바랍니다.

---

### 출처 및 참고

- [공식 문서: ChatGPT Work와 Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (유저스크립트)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: Codex를 거쳐 선택기 되살리기](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: Windows에서 선택기가 보이지 않음](https://github.com/openai/codex/issues/48700)
- [고객센터: 지원팀에 연락하는 방법](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
