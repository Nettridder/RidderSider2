<?php
/**
 * index.php - Hovedside for Mannskoret Arme Riddere
 * 
 * Dette er nettsidets hovedside (hjemmeside).
 * Her vises informasjon om koret, fakta, video og kontaktinformasjon.
 * 
 * @package ArmeRiddere
 * @author Mannskoret Arme Riddere
 */

// Inkluderer nødvendige filer
require_once(__DIR__ . '/includes/config.php');
require_once(__DIR__ . '/includes/html-helpers.php');

// Setter sidetittel
$pageTitle = 'Mannskoret Arme Riddere - Forside';

// Henter bilde-URLer fra WordPress eller fallback
$heroImageUrl = hentBildeEllerFallback(HERO_IMAGE_ID, HERO_IMAGE_FALLBACK);
$aboutImageUrl = hentBildeEllerFallback(ABOUT_IMAGE_ID, ABOUT_IMAGE_FALLBACK);
?>
<?php include('includes/head.php'); ?>

<body>
<canvas id="confetti"></canvas>

<?php visHeader('hjem'); ?>

  <section id="hero" class="hero" style="background-image: url('<?php echo $heroImageUrl; ?>'); background-size: cover; background-position: center;">
    <div class="hero-container">
      <h1>Mannskoret Arme <span onClick="window.location.href='?confetti=true'">Riddere</span></h1>
      <h2>At bedåre og begeistre</h2>
      <!-- <a href="/book-oss.php" class="btn-solid">Book oss!</a> -->
      <a href="/book-oss.php">
        <button class="btn-solid">Book oss!</button>
      </a>
    </div>
  </section>

  <main id="main">
    <section class="infobr" id="countdown">
      <div class="container fade-in">
        <div class="section-header">
          <h3 class="section-title"><span id="countdown-title">0</span></h3>
          <p class="section-description"><span id="countdown-subtitle">0</span></p>
        </div>
        <div class="row counters">
          <!-- Dager -->
  		<div class="col-lg-3 col-6 text-center">
            <span id="countdown-days">0</span>
            <p>dager</p>
  				</div>

          <!-- Timer -->
          <div class="col-lg-3 col-6 text-center">
            <span id="countdown-hours">0</span>
            <p>timer</p>
  				</div>

          <!-- Minutter -->
          <div class="col-lg-3 col-6 text-center">
            <span id="countdown-minutes">0</span>
            <p>minutter</p>
  				</div>

          <!-- Sekunder -->
          <div class="col-lg-3 col-6 text-center">
            <span id="countdown-seconds">0</span>
            <p>sekunder</p>
  				</div>

  			</div>

      </div>
    </section>

    <!-- ========================== 
         Om oss-seksjon
         Informasjon om koret og vår historie
    ============================ -->
    <section id="about">
      <div class="container">
        <div class="row about-container">

          <div class="col-lg-6 content order-lg-1 order-2">
            <h2 class="title">Om oss</h2>
            <p>
                Mannskoret Arme Riddere er det offisielle mannskoret ved Universitetet i Bergen. Vi består av <?php echo ANTALL_MEDLEMMER; ?> sangglade menn som etter beste evne forsøker å etterleve vår formålsparagraf: "At bedåre og begeistre med våre smektende mannsrøster og fortære vårt øl i festlig kameraderi".
            </p>
            <p>
                Repertoaret vårt spenner seg fra klassisk nasjonalromantikk via egenskrevne humorsanger til velkjente coverlåter.
            </p>
            <p>
                Vi ønsker å være en synlig del av bybildet og studentkulturen i Bergen og har tidligere opptrådt på Norske Talenter og under sykkel-VM. I tillegg til årlige vår- og julekonserter, samt konserten på universitetstrappen på 17. mai, gjennomfører vi hvert semester flere mindre faste konserter og arrangementer, blant annet på det Akademiske Kvarter.
            </p>
            <p>
                For oss er det sosiale like viktig som det musikalske, og vi søker alltid nye hyggelige fjes. For å bli medlem av Mannskoret Arme Riddere må man være student ved en av utdanningsinstitusjonene i Bergen, men man må ikke gå på UiB. Har du spørsmål, ta kontakt med Rittmester på tlf <?php echo CONTACT_PHONE; ?> eller <?php echo CONTACT_EMAIL; ?>
            </p>
          </div>
          
          <div class="col-lg-6 order-lg-2 order-1 fade-in text-center">
            <!-- Om oss-bilde (logo) - hentet fra WordPress eller lokalt -->
             <div class="gold">
            <img src="<?php echo $aboutImageUrl; ?>" 
                 class="img-fluid rounded" 
                 alt="Mannskoret Arme Riddere Logo" 
                 style="width: 100%; height: auto;">
                 </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================== 
         Fakta-seksjon
         Viser statistikk om koret i tall
    ============================ -->
    <section class="infobr" id="facts">
      <div class="container fade-in">
        <div class="section-header">
          <h3 class="section-title">Oppsummert i tall</h3>
          <p class="section-description"></p>
        </div>
        <div class="row counters">

          <!-- Antall medlemmer -->
  		<div class="col-lg-3 col-6 text-center">
            <span data-toggle="counter-up"><?php echo ANTALL_MEDLEMMER; ?></span>
            <p>Sangglade Studenter</p>
  				</div>

          <!-- Antall land vi har besøkt -->
          <div class="col-lg-3 col-6 text-center">
            <span data-toggle="counter-up" onclick="toggleFlagDisplay()" style="cursor: pointer;"><?php echo ANTALL_LAND_EROBRET; ?></span>
            <p>Land Erobret</p>
  				</div>

          <!-- Oppstartsår -->
          <div class="col-lg-3 col-6 text-center">
            <span data-toggle="counter-up"><?php echo OPPSTARTSAAR; ?></span>
            <p>Oppstart</p>
  				</div>

          <!-- TikTok-visninger -->
          <div class="col-lg-3 col-6 text-center">
            <span data-toggle="counter-up"><?php echo ANTALL_TIDLIGERE_RIDDERE; ?></span>
            <p>Antall Riddere</p>
        </div>

  			</div>

      </div>
    </section>
    <section id="flagContainer" style="display: none; width: 100%;" ></section>
    <!-- ========================== 
         Bli en ridder-seksjon
         Call-to-action for nye medlemmer
    ============================ -->
    <section id="call-to-action">
      <div class="container fade-in">
        <div class="row">
          <div class="col-lg-9 text-center text-lg-left">
            <h3 class="cta-title">Bli en <span id="easter-egg-trigger">ridder</span></h3>
            <p class="cta-text"> Arme Riddere har vanligvis opptak i begynnelsen av hvert semester. Mannskoret Arme Riddere er mer enn bare et kor: vi er en kameratgjeng! Vi fester, synger og har det gøy sammen. Alle kan komme på opptak og vi forutsetter ingen musikalsk erfaring.
              Mannskoret Arme Riddere har etterhvert stabilisert seg på et musikalsk nivå som ligger markant høyere enn “dusjnivået”, men det er ikke et absolutt krav at du har kor- eller sangerfaring fra før. En bra stemme og entusiasme kan være nok til at du er en av de som får tilbud om medlemskap etter opptaksrunden.
            </p>
          </div>
          <div class="col-lg-3 d-flex align-items-center justify-content-center">
            <a class="btn-hollow" href="https://www.facebook.com/mannskoretarmeriddere/events/?ref=page_internal">Opptak</a>
          </div>
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
          <h3 class="section-title">Kontakt oss</h3>
          <p class="section-description">Lurer du på noe? Ta kontakt!</p>
        </div>
      </div>

      <div class="container fade-in mt-5">
        <div class="row justify-content-center">

          <!-- Kontaktinformasjon -->
          <div class="col-lg-3 col-md-4">

            <div class="info">
              <div>
                <i class="fas fa-map-marker-alt"></i>
                <p><?php echo CONTACT_ADDRESS; ?></p>
              </div>

              <div>
                <i class="fas fa-envelope"></i>
                <p><a href="mailto:<?php echo CONTACT_EMAIL; ?>"><?php echo CONTACT_EMAIL; ?></a></p>
              </div>

              <div>
                <i class="fas fa-phone"></i>
                <p><a href="tel:<?php echo str_replace(' ', '', CONTACT_PHONE); ?>"><?php echo CONTACT_PHONE; ?></a></p>
              </div>
            </div>

            <div class="social-links">
              <a href="<?php echo YOUTUBE_URL; ?>" class="youtube" target="_blank" rel="noopener"><i class="fab fa-youtube"></i></a>
              <a href="<?php echo FACEBOOK_URL; ?>" class="facebook" target="_blank" rel="noopener"><i class="fab fa-facebook"></i></a>
              <a href="<?php echo INSTAGRAM_URL; ?>" class="instagram" target="_blank" rel="noopener"><i class="fab fa-instagram"></i></a>
              <a href="<?php echo TIKTOK_URL; ?>" class="tiktok" target="_blank" rel="noopener"><i class="fab fa-tiktok"></i></a>
            </div>

          </div>

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
                         placeholder="Ditt navn" 
                         required 
                         minlength="2" />
                  <div class="validation"></div>
                </div>
                
                <div class="form-group">
                  <input type="email" class="form-control" name="email" id="email" 
                         placeholder="Din e-post" 
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
                            placeholder="Din melding" 
                            required 
                            minlength="10"></textarea>
                  <div class="validation"></div>
                </div>
                
                <div class="text-center">
                  <button type="submit" class="btn-solid">Send melding</button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>
    </section>

  </main>

  <?php 
    // Vis footer ved hjelp av hjelpefunksjon
    visFooter(); 
  ?>

  <?php 
    // Inkluder alle JavaScript-biblioteker
    visScripts(); 
  ?>

  <script>
    // Real-time countdown til jubileum
    function updateCountdown() {
      // Jubileumsdato 30 års: 20. februar 2026 kl. 20:00 (norsk tid) endre til ønsket dato for neste jubileum eller andre hendelser
      // skjules automatisk når datoen er passert, så bare endre datoen her (trenger kunn å endre de to linjene under her)
      const jubileum = new Date('2026-02-20T19:30:00+01:00').getTime();
      document.getElementById('countdown-title').textContent = '30 års jubileum';
      document.getElementById('countdown-subtitle').textContent = '20. februar 2026';

      const now = new Date().getTime();
      const distance = jubileum - now;

      // Hvis nedtellingen er ferdig, skjul hele seksjonen
      if (distance < -86400000) {
        const countdownSection = document.querySelector('#countdown');
        if (countdownSection) {
          countdownSection.style.display = 'none';
        }
        return;
      }

      // Beregn tid
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      // Oppdater HTML
      document.getElementById('countdown-days').textContent = Math.max(0, days);
      document.getElementById('countdown-hours').textContent = Math.max(0, hours);
      document.getElementById('countdown-minutes').textContent = Math.max(0, minutes);
      document.getElementById('countdown-seconds').textContent = Math.max(0, seconds);
    }

    // Oppdater umiddelbart når siden laster
    updateCountdown();
    
    // Oppdater hvert sekund
    setInterval(updateCountdown, 1000);

    
  </script>
  <script>
    // glare on the emblem

    function setCustomProperties() {
      const target = document.documentElement;
      const viewPortSize = `${target.clientWidth}px ${target.clientHeight}px`;
      target.style.setProperty("--background-size", viewPortSize);
      target.style.setProperty("--scroll", window.pageYOffset + "px");
    }

    function goldEffect(textNode) {
      // set the element's vertical offset for the moving glare
      textNode.style.setProperty("--offsetY", textNode.getBoundingClientRect().top + "px");
    }

    // initial setup and dynamic updates
    function refreshGold() {
      document.querySelectorAll('.gold').forEach(el => goldEffect(el));
      setCustomProperties();
    }

    window.addEventListener('load', refreshGold);
    document.addEventListener('scroll', setCustomProperties, false);
    document.addEventListener('touchmove', setCustomProperties, false);
    window.addEventListener('resize', refreshGold, false);

    // run once now
    refreshGold();

    console.log("🎉confetti if h1-Riddere clicked");

  </script>

  <script>
        let flagsVisible = false;
 
        function toggleFlagDisplay() {
            const container = document.getElementById("flagContainer");
            const button = document.getElementById("toggleButton");
 
            if (!flagsVisible) {
                // Show flags and initialize them
                container.style.display = "block";
                initializeFlagIcons("flagContainer", {
                    circleSize: "70px",
                    gap: "16px",
                    shadowSpread: "8px",
                    shadowOpacity: 0.15
                });
                button.textContent = "Hide Choir Tour Destinations";
                flagsVisible = true;
            } else {
                // Hide flags
                container.style.display = "none";
                container.innerHTML = "";
                button.textContent = "Show Choir Tour Destinations";
                flagsVisible = false;
            }
        }
    </script>

</body>
</html>
