# Render deployment

The Render Blueprint in `render.yaml` builds the React frontend and starts the
Node server, which serves both the website and its same-origin API. It creates a
dispatcher access key in Render; copy that generated value to sign in through
the **Dispatcher view** button.

Incident data is held in the server's memory for this demo. It is shared between
reporters and dispatchers while the service is running, but it is lost whenever
Render restarts or redeploys the service. Do not use this temporary storage for
real emergency operations or sensitive information. Add durable storage and
appropriate operational safeguards before production use.

To deploy, push this repository to GitHub, create a new Blueprint on Render,
and select the repository containing `render.yaml`. The service is available
after the build completes. Render's free web service may sleep when idle; its
first request after sleeping can take longer while it starts again.

For local development, set a private key of at least 32 bytes and start the
server:

```powershell
$env:DISPATCHER_ACCESS_KEY = "<replace with a random secret of at least 32 bytes>"
npm start --prefix server
```

In a second terminal, install the frontend dependencies and start Vite:

```powershell
npm install --prefix frontend
npm run dev --prefix frontend
```

Vite forwards `/api` requests to the backend at `http://localhost:10000`.
