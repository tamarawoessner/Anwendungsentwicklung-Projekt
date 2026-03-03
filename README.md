# Anwendungsentwicklung-Projekt

Setup:
1) Projekt klonen und ins Verzeichnis wechseln
git clone https://github.com/tamarawoessner/Anwendungsentwicklung-Projekt/

3) Umgebungsdatei anlegen
Erstelle eine .env auf Basis von .env.example und ändere das Passwort

4) Backend starten
bash:
  docker compose pull
  docker compose up -d

5) Prüfen ob alles läuft:
Aktive Docker Container anzeigen: docker compose ps
API-Doku: http://localhost:8000/docs
