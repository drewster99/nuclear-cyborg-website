/**
 * Choices offered by the Scheduler "Get started" application form.
 *
 * Imported by both the landing page (browser module) and the Worker that
 * stores submissions, so the two can never disagree about what a valid
 * answer looks like.
 */

/** Follower-count brackets for platforms where audiences run large. */
export const LARGE_AUDIENCE_RANGES = [
    { value: "0-25k", label: "0 – 25k" },
    { value: "25k-100k", label: "25k – 100k" },
    { value: "100k-500k", label: "100k – 500k" },
    { value: "500k-1m", label: "500k – 1M" },
    { value: "1m-10m", label: "1M – 10M" },
    { value: "10m+", label: "More than 10M" },
];

/** Follower-count brackets for text-first platforms where audiences run smaller. */
export const SMALL_AUDIENCE_RANGES = [
    { value: "0-1k", label: "0 – 1,000" },
    { value: "1k-5k", label: "1,000 – 5,000" },
    { value: "5k-10k", label: "5,000 – 10k" },
    { value: "10k-25k", label: "10k – 25k" },
    { value: "25k-100k", label: "25k – 100k" },
    { value: "100k-500k", label: "100k – 500k" },
    { value: "500k+", label: "More than 500k" },
];

/** Follower value meaning the applicant has no account on that platform. */
export const NOT_ON_PLATFORM = "none";

/**
 * Platforms the form asks about, in the order they are shown.
 *
 * `handlePrefix` is the fixed text shown immediately before the handle input,
 * so the field reads the way the platform's own address does.
 */
export const PLATFORMS = [
    { id: "tiktok", name: "TikTok", handlePrefix: "@", handlePlaceholder: "username", ranges: LARGE_AUDIENCE_RANGES },
    { id: "instagram", name: "Instagram", handlePrefix: "@", handlePlaceholder: "username", ranges: LARGE_AUDIENCE_RANGES },
    { id: "youtube", name: "YouTube", handlePrefix: "@", handlePlaceholder: "channel handle", ranges: LARGE_AUDIENCE_RANGES },
    { id: "threads", name: "Threads", handlePrefix: "@", handlePlaceholder: "username", ranges: SMALL_AUDIENCE_RANGES },
    { id: "x", name: "X", handlePrefix: "@", handlePlaceholder: "username", ranges: SMALL_AUDIENCE_RANGES },
    { id: "bluesky", name: "Bluesky", handlePrefix: "@", handlePlaceholder: "handle.bsky.social", ranges: SMALL_AUDIENCE_RANGES },
    { id: "linkedin", name: "LinkedIn", handlePrefix: "in/", handlePlaceholder: "your-profile", ranges: SMALL_AUDIENCE_RANGES },
    { id: "mastodon", name: "Mastodon", handlePrefix: "@", handlePlaceholder: "you@instance.social", ranges: SMALL_AUDIENCE_RANGES },
];

/** Maximum lengths accepted for free-text answers. */
export const TEXT_LIMITS = {
    name: 100,
    company: 200,
    email: 254,
    phone: 30,
    handle: 100,
    comments: 2000,
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Loose email check: something@somewhere.tld, matching what the server accepts. */
export function isPlausibleEmailAddress(value) {
    return EMAIL_SHAPE.test(value) && value.length <= TEXT_LIMITS.email;
}

const PHONE_CHARACTERS = /^\+?[0-9 ()./-]+$/;
const PHONE_MINIMUM_DIGITS = 7;

/** Loose phone check: digits with common punctuation and at least seven digits. */
export function isPlausiblePhoneNumber(value) {
    return PHONE_CHARACTERS.test(value)
        && value.replace(/\D/g, "").length >= PHONE_MINIMUM_DIGITS
        && value.length <= TEXT_LIMITS.phone;
}

/** ISO 3166-1 alpha-2 codes with English names, sorted by name. */
export const COUNTRIES = [
    ["AF","Afghanistan"],["AX","Åland Islands"],["AL","Albania"],["DZ","Algeria"],["AS","American Samoa"],["AD","Andorra"],
    ["AO","Angola"],["AI","Anguilla"],["AQ","Antarctica"],["AG","Antigua & Barbuda"],["AR","Argentina"],["AM","Armenia"],
    ["AW","Aruba"],["AU","Australia"],["AT","Austria"],["AZ","Azerbaijan"],["BS","Bahamas"],["BH","Bahrain"],
    ["BD","Bangladesh"],["BB","Barbados"],["BY","Belarus"],["BE","Belgium"],["BZ","Belize"],["BJ","Benin"],
    ["BM","Bermuda"],["BT","Bhutan"],["BO","Bolivia"],["BA","Bosnia & Herzegovina"],["BW","Botswana"],["BV","Bouvet Island"],
    ["BR","Brazil"],["IO","British Indian Ocean Territory"],["VG","British Virgin Islands"],["BN","Brunei"],["BG","Bulgaria"],["BF","Burkina Faso"],
    ["BI","Burundi"],["KH","Cambodia"],["CM","Cameroon"],["CA","Canada"],["CV","Cape Verde"],["BQ","Caribbean Netherlands"],
    ["KY","Cayman Islands"],["CF","Central African Republic"],["TD","Chad"],["CL","Chile"],["CN","China"],["CX","Christmas Island"],
    ["CC","Cocos (Keeling) Islands"],["CO","Colombia"],["KM","Comoros"],["CG","Congo - Brazzaville"],["CD","Congo - Kinshasa"],["CK","Cook Islands"],
    ["CR","Costa Rica"],["CI","Côte d’Ivoire"],["HR","Croatia"],["CU","Cuba"],["CW","Curaçao"],["CY","Cyprus"],
    ["CZ","Czechia"],["DK","Denmark"],["DJ","Djibouti"],["DM","Dominica"],["DO","Dominican Republic"],["EC","Ecuador"],
    ["EG","Egypt"],["SV","El Salvador"],["GQ","Equatorial Guinea"],["ER","Eritrea"],["EE","Estonia"],["SZ","Eswatini"],
    ["ET","Ethiopia"],["FK","Falkland Islands"],["FO","Faroe Islands"],["FJ","Fiji"],["FI","Finland"],["FR","France"],
    ["GF","French Guiana"],["PF","French Polynesia"],["TF","French Southern Territories"],["GA","Gabon"],["GM","Gambia"],["GE","Georgia"],
    ["DE","Germany"],["GH","Ghana"],["GI","Gibraltar"],["GR","Greece"],["GL","Greenland"],["GD","Grenada"],
    ["GP","Guadeloupe"],["GU","Guam"],["GT","Guatemala"],["GG","Guernsey"],["GN","Guinea"],["GW","Guinea-Bissau"],
    ["GY","Guyana"],["HT","Haiti"],["HM","Heard & McDonald Islands"],["HN","Honduras"],["HK","Hong Kong SAR China"],["HU","Hungary"],
    ["IS","Iceland"],["IN","India"],["ID","Indonesia"],["IR","Iran"],["IQ","Iraq"],["IE","Ireland"],
    ["IM","Isle of Man"],["IL","Israel"],["IT","Italy"],["JM","Jamaica"],["JP","Japan"],["JE","Jersey"],
    ["JO","Jordan"],["KZ","Kazakhstan"],["KE","Kenya"],["KI","Kiribati"],["KW","Kuwait"],["KG","Kyrgyzstan"],
    ["LA","Laos"],["LV","Latvia"],["LB","Lebanon"],["LS","Lesotho"],["LR","Liberia"],["LY","Libya"],
    ["LI","Liechtenstein"],["LT","Lithuania"],["LU","Luxembourg"],["MO","Macao SAR China"],["MG","Madagascar"],["MW","Malawi"],
    ["MY","Malaysia"],["MV","Maldives"],["ML","Mali"],["MT","Malta"],["MH","Marshall Islands"],["MQ","Martinique"],
    ["MR","Mauritania"],["MU","Mauritius"],["YT","Mayotte"],["MX","Mexico"],["FM","Micronesia"],["MD","Moldova"],
    ["MC","Monaco"],["MN","Mongolia"],["ME","Montenegro"],["MS","Montserrat"],["MA","Morocco"],["MZ","Mozambique"],
    ["MM","Myanmar (Burma)"],["NA","Namibia"],["NR","Nauru"],["NP","Nepal"],["NL","Netherlands"],["NC","New Caledonia"],
    ["NZ","New Zealand"],["NI","Nicaragua"],["NE","Niger"],["NG","Nigeria"],["NU","Niue"],["NF","Norfolk Island"],
    ["KP","North Korea"],["MK","North Macedonia"],["MP","Northern Mariana Islands"],["NO","Norway"],["OM","Oman"],["PK","Pakistan"],
    ["PW","Palau"],["PS","Palestinian Territories"],["PA","Panama"],["PG","Papua New Guinea"],["PY","Paraguay"],["PE","Peru"],
    ["PH","Philippines"],["PN","Pitcairn Islands"],["PL","Poland"],["PT","Portugal"],["PR","Puerto Rico"],["QA","Qatar"],
    ["RE","Réunion"],["RO","Romania"],["RU","Russia"],["RW","Rwanda"],["WS","Samoa"],["SM","San Marino"],
    ["ST","São Tomé & Príncipe"],["SA","Saudi Arabia"],["SN","Senegal"],["RS","Serbia"],["SC","Seychelles"],["SL","Sierra Leone"],
    ["SG","Singapore"],["SX","Sint Maarten"],["SK","Slovakia"],["SI","Slovenia"],["SB","Solomon Islands"],["SO","Somalia"],
    ["ZA","South Africa"],["GS","South Georgia & South Sandwich Islands"],["KR","South Korea"],["SS","South Sudan"],["ES","Spain"],["LK","Sri Lanka"],
    ["BL","St. Barthélemy"],["SH","St. Helena"],["KN","St. Kitts & Nevis"],["LC","St. Lucia"],["MF","St. Martin"],["PM","St. Pierre & Miquelon"],
    ["VC","St. Vincent & Grenadines"],["SD","Sudan"],["SR","Suriname"],["SJ","Svalbard & Jan Mayen"],["SE","Sweden"],["CH","Switzerland"],
    ["SY","Syria"],["TW","Taiwan"],["TJ","Tajikistan"],["TZ","Tanzania"],["TH","Thailand"],["TL","Timor-Leste"],
    ["TG","Togo"],["TK","Tokelau"],["TO","Tonga"],["TT","Trinidad & Tobago"],["TN","Tunisia"],["TR","Türkiye"],
    ["TM","Turkmenistan"],["TC","Turks & Caicos Islands"],["TV","Tuvalu"],["UM","U.S. Outlying Islands"],["VI","U.S. Virgin Islands"],["UG","Uganda"],
    ["UA","Ukraine"],["AE","United Arab Emirates"],["GB","United Kingdom"],["US","United States"],["UY","Uruguay"],["UZ","Uzbekistan"],
    ["VU","Vanuatu"],["VA","Vatican City"],["VE","Venezuela"],["VN","Vietnam"],["WF","Wallis & Futuna"],["EH","Western Sahara"],
    ["YE","Yemen"],["ZM","Zambia"],["ZW","Zimbabwe"],
];
