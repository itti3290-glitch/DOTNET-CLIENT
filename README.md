# Library client

A small React + TypeScript (Vite) front end for the **Library API** (a separate repository/folder: `Library`).
It exists only to demonstrate the server end to end, so it is deliberately minimal: no router, no UI kit, no state library.

## What it shows

| Screen | What it demonstrates |
|---|---|
| **Login / Register** | Register, then log in. The JWT and the user are kept in `localStorage` and sent as `Authorization: Bearer ...`. An expired or rejected token (401) sends you back to login. |
| **Books** | A list with **server-side** paging, search (title, author, ISBN), "available only" and sorting. Every change is a new request to `GET /api/books`. |
| **Borrow** | The action on the limited resource: `POST /api/loans`. The button is disabled only when the list shows 0 copies. |
| **409 Conflict** | If someone else took the last copy between loading the list and clicking Borrow, the server answers 409. A yellow **Conflict (409)** banner explains it (with the server's message and the request's correlation id) and the list refreshes to the real stock. |
| **My loans** | Active loans (all loans for an admin) with a **Return** button: `POST /api/loans/{id}/return`. |

The API's uniform error JSON (`status`, `error`, `message`, `errors`, `correlationId`) is turned into readable banners in `src/api.ts` and `src/components/Banner.tsx`.

## Run it

Prerequisites: Node 20+ and the Library API running (see its README: `dotnet run --project Library.API --launch-profile http`, which listens on `http://localhost:5188`).

```
npm install
npm run dev
```

Open <http://localhost:5173>. The dev server port is fixed to **5173** because the API only allows that origin through CORS
(`Cors:AllowedOrigins` in the API's `appsettings.Development.json`). If you change the port, change it there too.

To point at another API address, copy `.env.example` to `.env.local` and set `VITE_API_URL`.

Demo accounts (created by the API's seed data, development only):

| Role | Email | Password |
|---|---|---|
| Member | `dana@library.local` | `Member123!` |
| Admin | `admin@library.local` | `Admin123!` |

### Seeing the 409 yourself

1. Log in as Dana, search for **Dune** (one copy). The list shows `1 / 1 available`.
2. Without refreshing, take that copy another way, e.g. in the API's Swagger UI: log in as the admin and `POST /api/loans` with `{ "bookId": 3, "memberId": 1 }`.
3. Back in the client, click **Borrow**. You get the 409 banner and the list updates to `0 / 1`.

## Scripts

- `npm run dev`: dev server
- `npm run build`: type-check (strict) and production build
- `npm run lint`: oxlint

## Structure

```
src/
  api.ts            fetch wrapper, ApiError, one function per endpoint used
  session.ts        login persistence (localStorage, checks expiry)
  types.ts          TypeScript shapes of the API's JSON
  App.tsx           login gate, tabs, logout / expired-session handling
  components/       AuthPage, BooksPage, LoansPage, Pager, Banner
```
