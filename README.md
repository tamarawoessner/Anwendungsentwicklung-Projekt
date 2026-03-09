# Anwendungsentwicklung-Projekt

Setup:
1) Projekt klonen und ins Verzeichnis wechseln
git clone https://github.com/tamarawoessner/Anwendungsentwicklung-Projekt/

2) Anwendung bauen
docker compose pull
docker compose up -d
Diese Befehle laden die Docker Container-Images und starten sowohl die Front- als auch die Backend Container.

3) Prüfen ob alles läuft:
Aktive Docker Container anzeigen unter docker compose ps

Frontend: http://localhost:3000
API-Doku: http://localhost:8000/docs