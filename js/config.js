/* ============================================================
   EDIT HERE — everything personal lives in this one file.
   Colors and fonts: see the :root block at the top of css/styles.css
   Images: replace files in assets/img/ (keep the same file names)
   ============================================================ */
window.INVITATION = {
  couple: { first: "Samy", second: "Yasmine" },

  date: {
    iso: "2027-07-27",
    display: "27 · 07 · 2027"
  },

  opening: {
    tapLabel: "Tap to Open",
    aboveEnvelope: "A wedding invitation"
  },

  hero: {
    intro: "Together with their families",
    announcement: "ARE GETTING MARRIED"
  },

  venue: {
    heading: "THE CELEBRATION",
    name: "La Salle des Fêtes",
    // PLACEHOLDER — replace with the real address
    address: "Salle Des Fêtes Gardenia",
    // PLACEHOLDER — replace with the real Google Maps share link
    // (Google Maps > Share > Copy link). Until then it opens a generic search.
    mapsUrl: "https://maps.app.goo.gl/6shEngmGSy875Nuz7",
    // OPTIONAL — paste the "src" of Google Maps > Share > Embed a map to show a live map
    // inside the frame. Leave empty to keep the illustrated map preview.
    mapEmbedUrl: "",
    buttonLabel: "Get Directions"
  },

  // Music. Replace the file in assets/audio/ (or change `src`) to use another track.
  // The default is a synthesized arrangement of Pachelbel's Canon in D (public-domain composition).
  music: {
    src: "assets/audio/canon-in-d.mp3",
    title: "Canon in D",
    artist: "Pachelbel"
  },

  closing: {
    message:
      "Your presence would make our special day even more meaningful. We would be delighted to celebrate this beautiful beginning with you.",
    signoff: "With love,"
  }
};
