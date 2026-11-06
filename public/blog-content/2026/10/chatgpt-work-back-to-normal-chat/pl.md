Niedawno przydarzyła mi się z ChatGPT dość absurdalna rzecz. Wszedłem jak zwykle i pojawiło się zaproszenie do wypróbowania **Work** z typowym przyciskiem **„Try Work”**. Dla jasności: wiem, czym jest Work, i znam go z praktyki. Kliknięcie było raczej w stylu *„zobaczmy, czy dodali coś nowego do Work”*.

Myślałem bardzo prosto: *„No dobrze, przeniesie mnie do Work, zobaczę, co nowego, a potem wrócę do zwykłego ChatGPT”*. Tak jak przy wielu innych nowościach. Nie sądziłem, że jedno kliknięcie może skomplikować coś tak podstawowego jak rozpoczęcie zwykłej rozmowy.

Kiedy jednak chciałem wrócić, czekała mnie niespodzianka: **ChatGPT dalej otwierał się w Work, a przełącznik między Chat a Work zniknął**. Czyli opcja, której miałem użyć, by cofnąć zmianę, wyparowała.

Nie chciałem włączać Work jako swojego domyślnego sposobu korzystania z ChatGPT. Chodziło tylko o to, żeby zobaczyć nowości. Zacząłem więc szukać, jak odzyskać normalny interfejs, i zebrałem te sposoby na wypadek, gdyby trafiło się to komuś jeszcze.

> **Uwaga:** przedstawione tu rozwiązania społeczności to *obejścia*, a nie gwarantowane oficjalne poprawki. Interfejs ChatGPT często się zmienia, a część z nich działa tylko w przeglądarce albo tylko w aplikacji desktopowej.

## Czym jest ChatGPT Work i dlaczego wygląda inaczej?

ChatGPT ma dwa odrębne tryby pracy: **Chat** — do rozmowy, zadawania pytań i korzystania z asystenta w zwykły sposób — oraz **Work**, nastawiony na dłuższe, wieloetapowe zadania. **Codex** to jeszcze inne środowisko, skupione na programowaniu.

Nie chodzi o to, że Work jest zły. Po prostu nie chcę używać go do wszystkiego. Jeśli wchodzę zadać szybkie pytanie, logiczne jest, żeby dało się zacząć zwykły czat bez walki z interfejsem.

Zgodnie z [dokumentacją OpenAI na temat ChatGPT Work i Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex) w aplikacji desktopowej powinno być możliwe wybranie **ChatGPT**, a następnie **Chat** albo **Work**. Problem zaczyna się wtedy, gdy tego przełącznika nie ma tam, gdzie powinien być.

## Rozwiązanie 1: otworzyć zwykły Chat bezpośrednio z adresu URL (przeglądarka)

Najprostsze rozwiązanie dla wersji webowej znalazłem w [wątku na Reddicie o powrocie do Chat zamiast Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Polega na otwarciu tego adresu:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Jeden z użytkowników wyjaśnił, że ta ścieżka pozwalała mu wejść prosto w zwykły tryb **Chat**, nawet jeśli wcześniej korzystał z Work. Dodawał, że przy takim wejściu przełącznik Chat/Work może się nie pokazywać — ale w tym przypadku dlatego, że sama ścieżka wymusza widok Chat.

Jeśli u ciebie zadziała, możesz zapisać adres w zakładkach i otwierać nim ChatGPT jak zwykle.

**Ważne:** `/bot` to alternatywne wejście udostępnione przez społeczność, a nie oficjalnie udokumentowana opcja przywracania domyślnego trybu konta. Może przestać działać albo zachowywać się inaczej w przyszłych wersjach. I **wejście tym adresem nie oznacza jeszcze, że odzyskałeś przełącznik**.

## Rozwiązanie 2: przejść przez Codex i wrócić do ChatGPT (aplikacja desktopowa)

Jeśli problem pojawia się w aplikacji desktopowej ChatGPT, jest jeszcze jedna metoda zgłaszana przez użytkowników, którzy stracili przełącznik **Chat/Work**:

1. Otwórz menu aplikacji i przełącz się z **ChatGPT** na **Codex**.
2. Utwórz **nowy czat** w Codex.
3. Przełącz się z powrotem z **Codex** na **ChatGPT**.
4. Utwórz kolejny **nowy czat**.
5. Sprawdź, czy przełącznik **Chat / Work** znowu się pojawia, i wybierz **Chat**.

Tę sekwencję opisał użytkownik w [zgłoszeniu #49233 w repozytorium Codex](https://github.com/openai/codex/issues/49233); napisał, że udało mu się odzyskać przełącznik na Windowsie po tym, jak inne próby nie pomogły.

To nie znaczy, że jest to oficjalna naprawa ani że zadziała w każdej wersji, ale ma więcej sensu niż przeinstalowywanie wszystkiego bez pewności, czy to pomoże.

## Rozwiązanie 3: wylogować się i zalogować ponownie

Inne zgłoszenie, [#48700](https://github.com/openai/codex/issues/48700), opisuje, że **świadome wylogowanie się** z aplikacji na Windowsie i ponowne zalogowanie przywróciło tryb Chat i jego przełącznik.

Są też użytkownicy, którym wylogowanie, restart ani reinstalacja **nic** nie dały. Dlatego traktowałbym to jako prostą próbę, a nie niezawodne rozwiązanie.

Zanim zaczniesz czyścić ciasteczka czy dane lokalne, po prostu wyloguj się i uwierzytelnij ponownie. W przeglądarce możesz też sprawdzić, czy problem występuje w innej sesji — choć to nie gwarantuje, że ustawienie konta zostanie poprawione.

## A skrypt Tampermonkey ustawiający Chat domyślnie?

W tym samym wątku na Reddicie udostępniono [userscript o nazwie „ChatGPT Default to Chat”](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184), przeznaczony dla menedżerów takich jak Tampermonkey.

Działa dość wprost: **szuka przycisku Chat na stronie i jeśli jest dostępny oraz niezaznaczony, próbuje go automatycznie kliknąć**. To sposób na zautomatyzowanie czynności w interfejsie, a nie na zmianę wewnętrznego ustawienia konta.

I tu ważny szczegół: **jeśli w danym widoku przełącznik albo przycisk Chat nie istnieje, skrypt nie ma czego kliknąć**. Może więc pomóc tym, którzy wciąż widzą przełącznik, ale po starcie lądują w Work — niekoniecznie tym, którzy stracili go całkowicie.

Poza tym to kod zewnętrzny uruchamiany w twojej przeglądarce. Jeśli zdecydujesz się go użyć, przejrzyj przed instalacją kod i uprawnienia. Nie stawiałbym go jako pierwszego rozwiązania, skoro wystarczy wypróbować adres URL.

## Czy to znaczy, że moje konto utknęło w Work?

Niekoniecznie. To, że interfejs otwiera się w Work albo że zniknął przełącznik, **nie dowodzi**, że na serwerach OpenAI zmieniono trwałe ustawienie. Może chodzić o interfejs, sesję, wersję aplikacji albo sposób udostępniania funkcji. Z zewnątrz nie da się ustalić dokładnej przyczyny dla konkretnego konta.

Nie trzeba też zakładać, że stare czaty zostały uszkodzone lub utracone. OpenAI wyjaśnia, że rozmowy z Chat i Work mogą pojawiać się razem w sekcji **Ostatnie**. Najjaśniejszy sposób sprawdzenia, czy wszystko wróciło do normy, to **utworzyć nowy czat** i zobaczyć, w jakim trybie się otworzy.

## Jeśli nic nie działa: zgłoś to do OpenAI

Jeśli nadal tkwisz w Work, możesz skontaktować się z pomocą techniczną przez [**https://help.openai.com/**](https://help.openai.com/), korzystając z ikony czatu w prawym dolnym rogu.

Najlepiej wyjaśnić, jaka czynność wywołała problem, na jakim urządzeniu występuje i co już próbowałeś. Na przykład:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

Nie podawaj w zgłoszeniu haseł, kodów dostępu ani wrażliwych informacji.

## Podsumowanie

Wszystko zaczęło się od tego, że nacisnąłem **„Try Work”**, żeby zobaczyć, co nowego jest w Work — narzędziu, które już znam z praktyki. Spodziewałem się tego co zwykle: wejść, zobaczyć nowości i wrócić do Chat, kiedy zechcę.

Frustrujący nie był sam Work, tylko to, że nie znalazłem oczywistej drogi powrotu do **Chat**, z którego chciałem korzystać od początku.

Jeśli trafiło się to tobie, zacząłbym od **`https://chatgpt.com/bot`, jeśli jesteś w przeglądarce**, albo od **przełączenia się na Codex i powrotu do ChatGPT, jeśli używasz aplikacji desktopowej**. To różne ścieżki dla różnych sytuacji i żadnej nie należy mylić z ostatecznym rozwiązaniem ze strony OpenAI.

Oby możliwość powrotu do zwykłego Chat była zawsze widoczna i nie trzeba było szukać sztuczek na Reddicie do czegoś tak podstawowego.

---

### Źródła i odniesienia

- [Oficjalna dokumentacja: ChatGPT Work i Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: odzyskanie przełącznika przez Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: brak przełącznika na Windowsie](https://github.com/openai/codex/issues/48700)
- [Centrum pomocy: jak skontaktować się z pomocą techniczną](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
