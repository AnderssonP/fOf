const http = require('http');
const fs = require('fs');
const path = require('path');
const pgp = require('pg-promise')();

const db = pgp({
    user: 'ap0548',             
    password: 'j7en9wgj',       
    database: 'jularkivet_ap0548', 
    host: 'pgserver.mah.se',
    client_encoding: 'UTF8'
});

const httpConn = http.createServer((req, resp) => {
    console.log(`Mottagen begäran: ${req.method} ${req.url}`);  

    if (req.method === 'GET' && (req.url.endsWith('.js') || req.url.endsWith('.css'))) {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                resp.writeHead(500, { 'Content-Type': 'text/html' });
                resp.end("<p>Fel vid servering av filen.</p>");
                return;
            }
            
            let contentType = 'text/plain';
            if (req.url.endsWith('.js')) contentType = 'application/javascript';
            if (req.url.endsWith('.css')) contentType = 'text/css';

            resp.writeHead(200, { 'Content-Type': contentType });
            resp.end(data);
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
            if (err) {
                resp.writeHead(500, { 'Content-Type': 'text/html' });
                resp.end("<p>Fel vid servering av HTML-sidan.</p>");
                return;
            }
            resp.writeHead(200, { 'Content-Type': 'text/html' });
            resp.end(data);
        });
        return;
    }

    if (req.method === 'GET' && req.url.startsWith('/fetch-movies')) {
        console.log(`Bearbetar GET-begäran för fetch-movies med URL: ${req.url}`);

        const url = new URL(req.url, `http://${req.headers.host}`);
        const queryType = url.searchParams.get('queryType');
        const searchParam = url.searchParams.get('searchParam');

        if (!queryType || !searchParam) {
            resp.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
            resp.end("<p>Fel: Ingen fråga eller parameter angavs!</p>");
            return;
        }

        switch (queryType) {
            case 'allMovies':
                getAllMovies()
                    .then((data) => sendResponse(resp, data))
                    .catch((err) => sendError(resp, err));
                break;
            case 'genre':
                getMoviesByGenre(searchParam)
                    .then((data) => sendResponse(resp, data))
                    .catch((err) => sendError(resp, err));
                break;
            case 'actor':
                getMoviesByActor(searchParam)
                    .then((data) => sendResponse(resp, data))
                    .catch((err) => sendError(resp, err));
                break;
            default:
                resp.writeHead(400, { 'Content-Type': 'text/html; charset=UTF-8' });
                resp.end("<p>Fel: Ogiltig frågetyp angavs!</p>");
                break;
        }
        return;
    }

    // Förfrågan till ogiltig metod eller annan path
    resp.writeHead(405, { 'Content-Type': 'text/html; charset=UTF-8' });
    resp.end("<p>Metod ej tillåten</p>");
});

// Skicka resultat som JSON
const sendResponse = (resp, data) => {
    resp.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
    resp.end(JSON.stringify(data));
};

// Skicka felmeddelande
const sendError = (resp, err) => {
    console.error("Fel vid query:", err.message);
    resp.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
    resp.end("<p>Fel vid hämtning av data: " + err.message + "</p>");
};

// Hämta alla filmer
const getAllMovies = () => {
    const query = `
        SELECT filmer.namn AS film_namn, genre.namn AS genre_namn, filmer.filmid, filmer.speltid, filmer.År
        FROM filmer;
    `;
    return db.query(query);
};

// Hämta filmer baserat på genre
const getMoviesByGenre = (genre) => {
    const query = `
    SELECT 
    filmer.namn AS film_namn, 
    genre.namn AS genre_namn, 
    filmer.filmid, 
    genre.genreid, 
    filmer.speltid, 
    filmer.År
    FROM filmer
    INNER JOIN filmgenre ON filmer.filmid = filmgenre.filmid
    INNER JOIN genre ON filmgenre.genreid = genre.genreid
    WHERE genre.namn ILIKE $1;
    `;
    return db.query(query, [genre]);
};

// Hämta filmer baserat på skådespelare
const getMoviesByActor = (actor) => {
    const query = `
        SELECT filmer.namn AS film_namn, skådespelare.namn AS actor_name, filmer.filmid, filmer.speltid, filmer.År
        FROM filmer
        INNER JOIN film_actor ON filmer.filmid = film_actor.filmid
        INNER JOIN skådespelare ON film_actor.actorid = skådespelare.actorid
        WHERE skådespelare.namn ILIKE $1;
    `;
    return db.query(query, [actor]);
};

// Starta servern
const port = 8081;
httpConn.listen(port, () => {
    console.log("Servern kör på port " + port);
});
