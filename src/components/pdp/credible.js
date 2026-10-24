import { isGovHealthSource } from '../../utils/govSources.js';

// Medical societies, journals, academic medical centers and non-US health
// bodies. Since Oct 24 2026 (founder rule) these are NOT treated as checked
// sources: only .gov health pages are (src/utils/govSources.js). Kept so the
// product page can label them for what they are.
export const MEDICAL_NON_GOV = /(\.gov|\.gov\.[a-z]{2}|\.mil|\.nhs\.uk|nice\.org\.uk|who\.int|europa\.eu|ncbi\.nlm\.nih|pubmed|cochranelibrary|cochrane\.org|doi\.org|nejm\.org|jamanetwork|thelancet|bmj\.com|nature\.com|sciencedirect|springer|wiley|tandfonline|sagepub|frontiersin|mdpi|plos|oup\.com|academic\.oup|journals\.lww|ajog\.org|acog\.org|aafp\.org|asrm\.org|menopause\.org|endocrine\.org|ics\.org|uptodate|mayoclinic\.org|clevelandclinic\.org|hopkinsmedicine|health\.harvard\.edu|medlineplus|cancer\.org|acs\.org|nccih|aad\.org|apa\.org|jmir\.org|healthychildren\.org|aap\.org|fda\.gov|cdc\.gov|\.edu\b|\.edu\.[a-z]{2}\b|\.ac\.[a-z]{2}\b|cureus\.com|thieme-connect|informahealthcare|biomedcentral|cmaj\.ca|emas-online\.org|kinseyinstitute\.org|yourpelvicfloor\.org|thepogp\.co\.uk|mdanderson\.org|bmc\.org|ibisreproductivehealth\.org|nigjdermatology\.com|acpjournals\.org|unimi\.it|unimore\.it|koreamed\.org|doaj\.org|issm\.info|isswsh\.org|reproductivefacts\.org|myadlm\.org|iro\.uiowa\.edu|research\.vu\.nl|essentialmeds\.org|niehs\.nih|medicaljournals\.se|mskcc\.org|cedars-sinai\.org|nyp\.org|stanfordhealthcare\.org|uofmhealth\.org|statpearls\.com|cambridge\.org)/i;
export const isMedicalNonGov = (url) => { try { const u = new URL(url); return !isGovHealthSource(url) && MEDICAL_NON_GOV.test(u.hostname + u.pathname); } catch { return false; } };
/** A checked source: a page on an allowed .gov health site (not a PubMed/PMC paper). */
export const isCredible = (url) => isGovHealthSource(url);
