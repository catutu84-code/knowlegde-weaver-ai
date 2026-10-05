<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Preserve the existing study-domain tables and extend them additively; this protects user data while keeping the learning journey connected.
- Pass selected study material between existing routes through session-scoped context; this avoids duplicate feature routes and stale permanent links.
- Keep Game Lab generation and scoring in authenticated server functions while the browser only renders owned session data; this preserves private material boundaries.
