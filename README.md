# GRA VAT Calculator

WordPress plugin for a Ghana Revenue Authority Value Added Tax page. The visitor enters a taxable value, or a final tax-inclusive cost. The calculator charges NHIL at 2.5%, the GETFund Levy at 2.5%, and VAT at 15%, each on the same taxable value. Those rates took effect on 1 January 2026 under the Value Added Tax Act, 2025 (Act 1151).

The shortcode is:

```
[vat_calculator]
```

The shortcode does not change between versions. After an update, existing pages keep working.

Repository: https://github.com/chillboy0101/gra-vat-calculator

Author: GRA IT Department (https://gra.gov.gh)

Maintainer: Carl Quist (https://github.com/chillboy0101)

Official rates: https://gra.gov.gh/domestic-tax/tax-types/vat/

The VAT page is https://gra.gov.gh/domestic-tax/tax-types/vat/. The rates in `assets/app.js` match that page: NHIL 2.5%, the GETFund Levy 2.5%, and VAT 15% are each charged on the same taxable value.

## What a visitor can do

The form has two modes.

- **Exclusive.** Enter the taxable value. NHIL, the GETFund Levy, and VAT are added.
- **Inclusive.** Enter the final cost. The calculator splits that amount into the taxable value and the three charges. The lines add back to the amount entered.

GRA's example is a taxable value of GH¢1,000. NHIL is GH¢25, the GETFund Levy is GH¢25, VAT is GH¢150, and the tax-inclusive total is GH¢1,200.

The COVID-19 Health Recovery Levy is not charged. The calculator does not use the old method of adding the levies and then charging 15% VAT on that larger base. It does not apply the abolished flat-rate schemes, VAT withholding, or input-tax credit. Zero-rated, exempt, and relieved supplies are outside this form. On those supplies, NHIL and the GETFund Levy follow the same treatment as VAT.

## What the plugin does not store

The calculation runs in the visitor's browser. Amounts and results are not sent to WordPress, to GRA, or to GitHub. The plugin has no accounts, no database tables, and no settings that hold taxpayer information.

## Install

1. Download `gra-vat-calculator.zip` from the latest release.
2. In WordPress, go to Plugins → Add New → Upload Plugin and choose that zip.
3. Activate **GRA VAT Calculator**.
4. Put `[vat_calculator]` in a page. On the Financity / Goodlayers builder, use a Text or Shortcode element.

The zip must contain a folder named `gra-vat-calculator` with `gra-vat-calculator.php` inside it. Do not install GitHub's automatic "Source code" zip. That zip uses a different folder name and WordPress will not treat it as this plugin.

`index.html` in the project folder is a local preview. It is not part of the plugin zip. Do not upload the older `gra-vat-levies-calculator.zip`.

## Updates

The plugin header contains:

```
Update URI: https://github.com/chillboy0101/gra-vat-calculator
```

WordPress asks GitHub for the latest release. If the release version is higher than the installed version, Plugins shows an update. The download address must be exactly:

```
https://github.com/chillboy0101/gra-vat-calculator/releases/download/vX.Y.Z/gra-vat-calculator.zip
```

`X.Y.Z` is the version in the plugin file, and the tag must be `vX.Y.Z`. Any other address is ignored. The plugin does not use a token, does not log into GitHub, and does not follow a download link that points anywhere else.

On the first admin page, if WordPress has not stored an update check for this plugin yet, the plugin asks once. The Plugins row then shows View details. It does not retry that call more than once every couple of minutes.

Click **Enable auto-updates** on the Plugins screen if a new release should install itself. Leave it off if a person should press Update after looking at the release. Auto-updates install whatever zip is attached to the newest trusted release, so publish a release only after the zip has been checked.

On the live GRA site, install the reviewed zip once and leave Enable auto-updates off.

This repository is **public**. It has to be public so WordPress can download the zip without a password stored on the website. The code and the tax rates are public information. The repository must not be made private unless the update checker is redesigned, because a private repository would stop updates.

## Security rules

Protect the GitHub account `chillboy0101`. Turn on two-factor authentication. Do not share the password. A person who can publish a release can ship code to every site that has auto-updates turned on.

Never commit any of these:

- WordPress passwords, database passwords, or `wp-config.php`
- GitHub tokens, personal access tokens, or SSH private keys
- Taxpayer names, TINs, salaries, or calculator results
- A copy of the live GRA website, its uploads, or its database

The calculation does not phone home. The only network call the plugin makes is the WordPress admin update check to `https://api.github.com/repos/chillboy0101/gra-vat-calculator/releases/latest`. Visitors who use the calculator do not trigger that call.

Before you publish a release, open the zip and confirm it contains `gra-vat-calculator/gra-vat-calculator.php` and `gra-vat-calculator/includes/class-github-updater.php`, and that it does not contain a `.git` folder.

## Publish a new version

1. Change both `Version:` and `const VERSION` in `gra-vat-calculator.php` to the same new number, such as `1.0.9`.
2. Copy the preview `app.js` and `styles.css` into `assets/` after editing them.
3. From this folder, run `bash build-zip.sh`. It writes `dist/gra-vat-calculator.zip` and refuses to include `.git`.
4. Commit the version change and push it to `main`.
5. Create a GitHub release. The tag must be `v` plus the version, for example `v1.0.9`.
6. Attach the zip. Its file name must stay `gra-vat-calculator.zip`.
7. On a site that has the plugin, open Plugins and use Check again if the update is not listed yet. The check is cached for 30 minutes.

Do not attach a second zip with a different name. The plugin accepts only `gra-vat-calculator.zip`.
