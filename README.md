# Anwendungsentwicklung-Projekt

Setup:
1) Projekt klonen und ins Verzeichnis wechseln
     git clone https://github.com/tamarawoessner/Anwendungsentwicklung-Projekt/

2) Umgebungsdatei anlegen
     Erstelle eine .env auf Basis von .env.example und ändere das Passwort

3) Backend starten
     bash:
       docker compose pull
       docker compose up -d

Prüfen ob alles läuft:
  Aktive Docker Container anzeigen: docker compose ps
  API-Doku: http://localhost:8000/docs
