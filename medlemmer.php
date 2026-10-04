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
$pageTitle = 'Medlemmer - Mannskoret Arme Riddere';
?>
<?php include('includes/head.php'); ?>

<body>
    <canvas id="confetti"></canvas>
    <?php visHeader('medlemmer'); ?>
    
    <!-- ========================== 
    Medlemmer-seksjon
    Viser alle medlemmer organisert etter stemmegruppe
    ============================ -->
    <section id="team" style = "padding-top: 130px; padding-bottom: 60px;">

    <div style="position: absolute; top: 100px; right: 20px; z-index: 1;">
        <a href="/margames" aria-label="Gå til MARgames" style="display: block; width: 90px; ">
            <img src="margames/assets/MARgamesIcon.png" class="team-logo" style="display: block; width: 50%; height: auto;" alt="MARgames">
        </a>
    </div>
<?php
// Definerer alle stemmegrupper vi skal vise
$stemmegrupper = array(
    'dirigent' => 'Dirigent',
    '1-tenor' => '1.Tenor',
    '2-tenor' => '2.Tenor',
    '1-bass' => '1.Bass',
    '2-bass' => '2.Bass',
);

// Itererer gjennom hver stemmegruppe og viser medlemmene
foreach ($stemmegrupper as $gruppe => $tittel) {
    // Henter medlemmer for denne stemmegruppen fra WordPress
    $medlemmer = hentMedlemmer($gruppe);
    
    // Vis kun seksjoner som faktisk har medlemmer
    if (!empty($medlemmer)) {
        visMedlemSeksjon($tittel, $medlemmer);
    }
}
?>
</section>

<?php 
// Vis footer ved hjelp av hjelpefunksjon
visFooter(); 
?>

<?php 
// Inkluder alle JavaScript-biblioteker
visScripts(); 
?>

</body>
</html>
