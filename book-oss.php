<?php
/**
 * medlemmer.php - Medlemssiden for Mannskoret Arme Riddere
 * 
 * Denne siden viser alle medlemmene i koret, organisert etter stemmegruppe.
 * Medlemsdata hentes dynamisk fra WordPress-databasen.
 * 
 * @package ArmeRiddere
 * @author Mannskoret Arme Riddere
 */

// Inkluderer nødvendige hjelpefunksjoner
require_once(__DIR__ . '/includes/html-helpers.php');
require_once(__DIR__ . '/includes/wordpress.php');

// Setter sidetittel
$pageTitle = 'Book Oss - Mannskoret Arme Riddere';
?>
<?php include('includes/head.php'); ?>

<body>
  <canvas id="confetti"></canvas>
  <?php visHeader('book-oss'); ?>
  <main id="main" style="margin-top: 150px;">
    <div class="container fade-in">
      <div class="section-header">
        <h3 class="section-title">BOOK OSS</h3>
        <p class="section-description">Trenger du å bli bedåret og begeistret?</p>
      </div>
    </div>
    <?php visCarousel(); ?>
    <div id="book-oss-info" class="fade-in">
      <div class="row">
        <div class="col-12 d-flex justify-content-center">
          <div class="book-info-box" style="width:100%;padding:30px;border-radius:12px;text-align:center;">
            <h3>Hvorfor booke Mannskoret Arme Riddere?</h3>
            <p class="book-info-text container">
              Mannskoret Arme Riddere har i over <?php echo round((date('Y') - OPPSTARTSAAR)/5)*5; ?> år tilbudt et bredt musikalsk repertoar som strekker seg fra klassisk mannskorsang i Bellmans ånd via sjarmerende bedåringslåter til skikkelige show- og humorlåter som vil sette stemningen for enhver anledning. MAR kan heve eksempelvis møtet, julebordet, sommerfesten eller bryllupet til et nytt nivå. Vi tilpasser oss deres ønsker og garanterer topp underholdning til enhver anledning.
            </p>
          </div>
        </div>
      </div>
    </div>
    <!-- Praktisk info: beskriver oppsett, oppvarming og oppmikking -->
    <section id="praktisk-info" class="fade-in">
      <div class="container heighlight mt-5 boxed praktisk-clickable" style="margin-bottom: 50px;">
        <div class="section-header praktisk-header">
          <h3 class="section-title">Praktisk informasjon for arrangement</h3>
          <p class="section-description">Noen praktiske detaljer vi ofte blir spurt om.</p>
        </div>

        <div id="praktisk-info-content" class="collapse">
          <div class="row justify-content-center">
            <div class="col-lg-8">
              <div>
                <h4>Innsyng og introer</h4>
                <p>
                  En ting vi ofte må klargjøre er at vi som standard <strong>synger oss inn</strong> og har korte <strong>introer mellom sangene</strong>. Dette gir oss tid til å få riktig klang og gir et naturlig flow i konserten.
                  Hvis dere ønsker en mer kompakt eller direkte gjennomføring uten innsyng og introer (for eksempel ved korte arrangement eller mange taler), kan dette sløyfes — gi oss beskjed ved bestilling så tilpasser vi oss.
                </p>

                <h4>Oppvarming</h4>
                <p>
                  Vi trenger gjerne et stille sted til oppvarming i ca. 30-60 minutter før opptreden. Dersom det ikke er mulig, tilpasser vi oss og bruker tilgjengelig ankomsttid.
                </p>

                <h4>Oppmikking</h4>
                <p>
                  Spørsmålet om oppmikking avhenger av lokalet, publikum og antall sangere. I mindre, akustiske lokaler klarer vi oss ofte uten mikrofoner, men for større lokaler eller ved dårlig akustikk anbefaler vi noen mikrofoner. Send gjerne informasjon om lokalet (størrelse, scene, og dere trenger oppmikking), så gir vi konkrete anbefalinger.
                </p>

                <h4>Tidsplan og øvrige ønsker</h4>
                <p>
                  Har dere spesielle ønsker om rekkefølge, inkludering av taler eller kortere opptreden uten innsyng/intro, si fra i forkant slik at vi kan planlegge. Vi gjør vårt beste for å imøtekomme praktiske begrensninger på arrangementsdagen.
                </p>

                <p><strong>Kontakt</strong>: Bruk booking-skjemaet under og send en kort beskrivelse av lokalet og ønsker via skjemaet, så følger vi opp med detaljer og anbefalinger.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center">
          <div class="btn-hollow praktisk-toggle-arrow">^</div>
        </div>
      </div>
    </section>
    <!-- ========================== 
        Kontakt-seksjon
        Kontaktinformasjon og sosiale medier
    ============================ -->
    <section id="contact">
      <div class="container fade-in">
        <div class="section-header">
          <h3 class="section-title">Book oss</h3>
          <!-- <p class="section-description">Lurer du på noe? Ta kontakt!</p> -->
        </div>
      </div>
      <div class="container fade-in mt-5">
        <div class="row justify-content-center">
          <!-- Kontaktskjema -->
          <div class="col-lg-5 col-md-8">
            <div class="form">
              <div id="sendmessage" style="display:none;" class="alert alert-success">
                Takk for din melding! Vi tar kontakt så snart som mulig.
              </div>
              <div id="errormessage" style="display:none;" class="alert alert-danger"></div>
              <form action="contactform/contactform.php" method="post" role="form" class="contactForm">
                <div class="form-group">
                  <input type="text" name="name" class="form-control" id="name" 
                        placeholder="navn" 
                        required 
                        minlength="2" />
                  <div class="validation"></div>
                </div>
                <div class="form-group">
                  <input type="email" class="form-control" name="email" id="email" 
                        placeholder="e-post" 
                        required />
                  <div class="validation"></div>
                </div>
                <div class="form-group">
                  <input type="text" class="form-control" name="subject" id="subject" 
                        placeholder="Emne"
                        required 
                        minlength="4" />
                  <div class="validation"></div>
                </div>
                <div class="form-group">
                  <textarea class="form-control" name="message" rows="5" 
                            placeholder="Booking info og eventuelle spørsmål" 
                            required 
                            minlength="10"></textarea>
                  <div class="validation"></div>
                </div>
                <div class="text-center">
                  <button type="submit" class="btn-solid">Send booking</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>  <?php 
    // Vis footer ved hjelp av hjelpefunksjon
    visFooter(); 
  ?>

  <?php 
    // Inkluder alle JavaScript-biblioteker
    visScripts(); 
  ?>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var box = document.querySelector('#praktisk-info .praktisk-clickable');
      var content = document.getElementById('praktisk-info-content');
      if (!box || !content) return;

      // Initialize Bootstrap collapse (toggle disabled)
      var bsCollapse = new bootstrap.Collapse(content, { toggle: false });

      // make whole boxed area toggle
      box.addEventListener('click', function (e) {
        bsCollapse.toggle();
      });
    });
  </script>
  <style>
    /* Support button wrapped in a wrapper div (.text-center) or placed directly after content */
    #praktisk-info-content.collapse:not(.show) + .text-center .praktisk-toggle-arrow {
      transform: rotate(180deg);
    }
    /* Ensure arrow rotates back when content is shown */
    #praktisk-info-content.collapse.show + .text-center .praktisk-toggle-arrow {
      transform: rotate(0deg);
    }
</body>
</html>
