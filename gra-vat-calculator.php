<?php
/**
 * Plugin Name: GRA VAT Calculator
 * Plugin URI: https://github.com/chillboy0101/gra-vat-calculator
 * Description: Value Added Tax calculator for the Ghana Revenue Authority website. Uses the 1 January 2026 rates: NHIL 2.5%, GETFund Levy 2.5%, and VAT 15% on the same taxable value.
 * Version: 1.0.8
 * Author: GRA IT Department
 * Author URI: https://gra.gov.gh
 * License: GPL v2 or later
 * Text Domain: gra-vat-calculator
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Tested up to: 7.1.3
 * Update URI: https://github.com/chillboy0101/gra-vat-calculator
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/includes/class-github-updater.php';

class GRA_VAT_Calculator {

    const VERSION = '1.0.8';
    const SHORTCODE = 'vat_calculator';

    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue'));
        add_shortcode(self::SHORTCODE, array($this, 'render_calculator'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    public function maybe_enqueue() {
        if ($this->page_contains_shortcode()) {
            $this->enqueue_assets();
        }
    }

    public function render_calculator($atts) {
        $atts = shortcode_atts(
            array(
                'class' => '',
            ),
            $atts,
            self::SHORTCODE
        );

        $this->enqueue_assets();

        // Goodlayers often prints the shortcode after wp_head, so a style
        // queued only in wp_enqueue_scripts never reaches the page.
        if (did_action('wp_head')) {
            wp_print_styles('gra-vat-calculator-css');
        }

        $class = trim('gra-vat-mount ' . $atts['class']);

        return '<div id="gra-vat-calculator" class="' . esc_attr($class) . '"></div>';
    }

    public function add_admin_menu() {
        add_options_page(
            'VAT Calculator Settings',
            'VAT Calculator',
            'manage_options',
            'gra-vat-calculator',
            array($this, 'settings_page')
        );
    }

    public function settings_page() {
        $css_file = plugin_dir_path(__FILE__) . 'assets/styles.css';
        $js_file = plugin_dir_path(__FILE__) . 'assets/app.js';
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <div class="card">
                <h2>How to use</h2>
                <p>Add this shortcode to a page. On the Financity / Goodlayers builder, put it in a Text or Shortcode element:</p>
                <code>[vat_calculator]</code>
                <h3>Files</h3>
                <p>CSS: <?php echo file_exists($css_file) ? '<span style="color: green;">Found</span>' : '<span style="color: red;">Missing</span>'; ?></p>
                <p>JavaScript: <?php echo file_exists($js_file) ? '<span style="color: green;">Found</span>' : '<span style="color: red;">Missing</span>'; ?></p>
                <p>Rates: from 1 January 2026 (Value Added Tax Act, 2025, Act 1151). NHIL 2.5%, GETFund Levy 2.5%, and VAT 15% are each charged on the same taxable value.</p>
                <p>Updates: newer versions published as GitHub releases of chillboy0101/gra-vat-calculator appear under Plugins → Updates. The shortcode stays <code>[vat_calculator]</code>.</p>
            </div>
        </div>
        <?php
    }

    private function enqueue_assets() {
        $css = 'assets/styles.css';
        $js = 'assets/app.js';

        if (!wp_style_is('gra-vat-calculator-css', 'enqueued') && !wp_style_is('gra-vat-calculator-css', 'done')) {
            wp_enqueue_style(
                'gra-vat-calculator-css',
                plugin_dir_url(__FILE__) . $css,
                array(),
                $this->asset_version($css)
            );
        }

        if (!wp_script_is('gra-vat-calculator-js', 'enqueued') && !wp_script_is('gra-vat-calculator-js', 'done')) {
            wp_enqueue_script(
                'gra-vat-calculator-js',
                plugin_dir_url(__FILE__) . $js,
                array(),
                $this->asset_version($js),
                true
            );
        }
    }

    private function asset_version($relative) {
        $path = plugin_dir_path(__FILE__) . $relative;
        $mtime = file_exists($path) ? filemtime($path) : time();
        return self::VERSION . '.' . $mtime;
    }

    private function page_contains_shortcode() {
        if (!is_singular()) {
            return false;
        }

        global $post;
        if (!is_a($post, 'WP_Post')) {
            return false;
        }

        if (has_shortcode($post->post_content, self::SHORTCODE)) {
            return true;
        }

        $meta = get_post_meta($post->ID);
        if (!is_array($meta)) {
            return false;
        }

        foreach ($meta as $values) {
            foreach ((array) $values as $value) {
                if (is_string($value) && strpos($value, self::SHORTCODE) !== false) {
                    return true;
                }
            }
        }

        return false;
    }
}

function gra_vat_calculator_init() {
    new GRA_VAT_GitHub_Updater(__FILE__);
    new GRA_VAT_Calculator();
}
add_action('plugins_loaded', 'gra_vat_calculator_init');
