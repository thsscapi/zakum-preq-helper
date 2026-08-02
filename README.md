# Zakum Prequest Helper

## Private access

Every request is protected by server-side middleware. Configure these environment variables in Vercel for Production and Preview:

- `OWNER_PASSWORD`: the permanent owner password
- `AUTH_SECRET`: a long random value used to sign login sessions

Owner sessions last 30 days. The owner-only panel shows a six-digit guest PIN that rotates automatically at midnight Singapore time. Guest sessions last 24 hours after login. Changing the owner PIN invalidates existing owner sessions; rotating `AUTH_SECRET` invalidates every session. No PIN or secret is included in the browser bundle or committed to the repository.

After changing an environment variable, redeploy the app so the new value applies.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
