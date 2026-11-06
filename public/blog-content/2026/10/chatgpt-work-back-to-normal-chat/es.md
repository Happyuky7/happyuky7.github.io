Hace poco me pasó algo bastante absurdo con ChatGPT. Entré como siempre y me apareció una invitación para probar **Work** con el típico botón **«Try Work»**. Y ojo: sé lo que es Work y ya lo había usado. Le di clic más bien pensando *«a ver si metieron algo nuevo en Work»*.

Mi pensamiento fue muy simple: *«Ah, vale, me llevará a Work, veo qué hay de nuevo y después vuelvo al ChatGPT de siempre»*. Como ocurre con tantas funciones nuevas. No pensé que ese clic pudiera complicar algo tan básico como iniciar una conversación normal.

Pero cuando quise volver, me encontré con una sorpresa: **ChatGPT seguía abriéndose en Work y el selector para cambiar entre Chat y Work ya no aparecía**. Es decir, la opción que esperaba usar para deshacer el cambio parecía haberse esfumado.

No estaba buscando activar Work como mi forma habitual de usar ChatGPT. Solo quería ver qué novedades traía. Así que me puse a investigar cómo recuperar la interfaz normal y reuní estas alternativas por si a alguien más le pasa.

> **Nota:** las soluciones de la comunidad que aparecen aquí son *workarounds*, no correcciones oficiales garantizadas. La interfaz de ChatGPT cambia con frecuencia y algunas alternativas funcionan solo en la web o solo en la aplicación de escritorio.

## ¿Qué es ChatGPT Work y por qué se ve diferente?

ChatGPT tiene dos experiencias distintas: **Chat**, para conversar, hacer preguntas y usar el asistente de la manera habitual, y **Work**, orientada a tareas más largas que requieren varios pasos. **Codex** es otra experiencia, centrada en programación.

No es que Work sea malo. Simplemente no quiero usarlo para todo. Si entro a hacer una pregunta rápida, lo lógico es que pueda iniciar un chat normal sin tener que pelearme con la interfaz.

Según la [documentación de OpenAI sobre ChatGPT Work y Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex), en la aplicación de escritorio debería ser posible seleccionar **ChatGPT** y luego elegir **Chat** o **Work**. El problema empieza cuando ese selector no está donde debería.

## Solución 1: abrir el Chat normal directamente desde una URL (web)

La alternativa más sencilla que encontré para la versión web viene de un [hilo de Reddit sobre cómo volver a Chat en lugar de Work](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/).

Consiste en abrir esta dirección:

[**https://chatgpt.com/bot**](https://chatgpt.com/bot)

Un usuario explicó que esa ruta le permitía entrar directamente a la experiencia normal de **Chat**, aunque antes hubiera estado usando Work. Incluso comentaba que, al entrar así, el selector Chat/Work podía no mostrarse, pero en ese caso porque la ruta estaba forzando la vista de Chat.

Si te funciona, puedes guardarla en favoritos y usarla para abrir ChatGPT de la manera habitual.

**Importante:** `/bot` es un acceso alternativo compartido por la comunidad, no una opción oficial documentada para restablecer el modo predeterminado de la cuenta. Puede dejar de funcionar o comportarse de otra forma en futuras versiones. Y **entrar por esa URL no significa necesariamente que hayas recuperado el selector**.

## Solución 2: pasar por Codex y volver a ChatGPT (app de escritorio)

Si el problema aparece en la aplicación de escritorio de ChatGPT, hay otro método reportado por usuarios que perdieron el selector **Chat/Work**:

1. Abre el menú de la aplicación y cambia de **ChatGPT** a **Codex**.
2. Crea un **chat nuevo** en Codex.
3. Vuelve a cambiar de **Codex** a **ChatGPT**.
4. Crea otro **chat nuevo**.
5. Comprueba si vuelve a aparecer el selector **Chat / Work** y elige **Chat**.

Esta secuencia fue descrita por un usuario en el [issue #49233 del repositorio de Codex](https://github.com/openai/codex/issues/49233), quien indicó que logró recuperar el selector en Windows después de que otros intentos no le funcionaran.

No significa que sea una reparación oficial ni que vaya a funcionar en todas las versiones, pero tiene más sentido probarlo que reinstalar todo sin saber si ayudará.

## Solución 3: cerrar sesión y volver a entrar

Otro reporte, el [issue #48700](https://github.com/openai/codex/issues/48700), cuenta que **cerrar sesión explícitamente** en la aplicación de Windows y volver a iniciar sesión restauró el modo Chat y su selector.

También hay usuarios a quienes cerrar sesión, reiniciar o reinstalar **no** les solucionó nada. Por eso lo consideraría un intento sencillo, pero no una solución infalible.

Antes de borrar cookies o datos locales, prueba simplemente a cerrar sesión y autenticarte de nuevo. Si usas la web, puedes comprobar también si el problema ocurre en otra sesión del navegador, aunque eso no asegura que se corrija la configuración de tu cuenta.

## ¿Y el script de Tampermonkey para dejar Chat por defecto?

En el mismo hilo de Reddit compartieron un [userscript llamado «ChatGPT Default to Chat»](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184), pensado para gestores como Tampermonkey.

Su funcionamiento es bastante directo: **busca el botón de Chat en la página y, si está disponible y no está seleccionado, intenta pulsarlo automáticamente**. Es una forma de automatizar una acción en la interfaz, no de cambiar una configuración interna de la cuenta.

Aquí está el detalle importante: **si el selector o el botón de Chat no existe en esa vista, el script no tiene nada que pulsar**. Por tanto, puede resultar útil para quienes siguen viendo el selector pero vuelven a Work al iniciar, no necesariamente para quienes lo perdieron por completo.

Además, es código de terceros que se ejecuta en tu navegador. Si decides usarlo, revisa el código y sus permisos antes de instalarlo. Yo no lo pondría como primera solución cuando basta con probar una URL.

## ¿Significa esto que mi cuenta quedó bloqueada en Work?

No necesariamente. Que la interfaz se abra en Work o que el selector haya desaparecido **no demuestra** que se haya cambiado una opción permanente en los servidores de OpenAI. Puede tratarse de un problema de interfaz, sesión, versión de la aplicación o del despliegue de la función. Desde fuera no es posible saber cuál es la causa exacta en cada cuenta.

Tampoco hay que asumir que los chats antiguos se hayan dañado o perdido. OpenAI explica que las conversaciones de Chat y Work pueden aparecer juntas en **Recientes**. Para comprobar si recuperaste el funcionamiento normal, lo más claro es **crear un chat nuevo** y verificar en qué modo se abre.

## Si nada funciona: reportarlo a OpenAI

Si sigues atrapado en Work, puedes contactar al soporte desde [**https://help.openai.com/**](https://help.openai.com/) utilizando el icono de chat de la esquina inferior derecha.

Lo mejor es explicar qué acción disparó el problema, en qué dispositivo sucede y qué soluciones ya intentaste. Por ejemplo:

```text
I clicked "Try Work" in the onboarding prompt. Since then,
ChatGPT opens in Work by default and the Chat/Work selector
is missing. I expected to be able to switch back to normal Chat.

Please help restore the Chat/Work selector or the normal Chat
experience on my account.

Platform: [web / Windows / macOS]
What I've tried: [list your attempts]
```

No compartas contraseñas, códigos de acceso ni información sensible en el reporte.

## Conclusión

Todo esto empezó porque pulsé **«Try Work»** para ver qué había de nuevo en Work, una herramienta que ya conocía y había usado. Esperaba lo de siempre: entrar, ver las novedades y volver a Chat cuando quisiera.

Lo frustrante no fue Work en sí, sino encontrarme sin un camino evidente para regresar a **Chat**, que era lo que quería usar desde el principio.

Si te pasó lo mismo, empezaría por **`https://chatgpt.com/bot` si estás en la web**, o por **cambiar a Codex y volver a ChatGPT si estás en la aplicación de escritorio**. Son caminos distintos para situaciones distintas y ninguno debe confundirse con un arreglo definitivo de OpenAI.

Ojalá la opción de volver al Chat normal sea siempre visible y no haya que buscar trucos en Reddit para algo tan básico.

---

### Fuentes y referencias

- [Documentación oficial: ChatGPT Work y Codex](https://help.openai.com/es-419/articles/20001275-chatgpt-work-and-codex)
- [Reddit: Anyone able to get it to default to Chat instead of Work?](https://www.reddit.com/r/ChatGPT/comments/1vz0wqs/anyone_able_to_get_it_to_default_to_chat_instead/)
- [GitHub Gist: ChatGPT Default to Chat (userscript)](https://gist.github.com/gabrielzv1233/811a56ee7f59e44a25e6ea8a65697184)
- [GitHub issue #49233: recuperación del selector cambiando por Codex](https://github.com/openai/codex/issues/49233)
- [GitHub issue #48700: selector ausente en Windows](https://github.com/openai/codex/issues/48700)
- [Centro de ayuda: cómo contactar a soporte](https://help.openai.com/es-419/articles/6614161-how-can-i-contact-support)
