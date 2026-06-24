// backend/controllers/emailController.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export const extractEmails = async (req, res) => {
  try {
    const { url, deep = false, maxPages = 5, extractSocial = true } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const results = await extractEmailsFromUrl(url, deep, maxPages, extractSocial);
    res.json({ success: true, count: results.length, leads: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkExtractEmails = async (req, res) => {
  try {
    const { urls, deep = false, maxPagesPerUrl = 5, extractSocial = true } = req.body;
    if (!urls || !urls.length) return res.status(400).json({ error: 'URLs required' });

    let allLeads = [];
    for (const url of urls.slice(0, 20)) {
      const leads = await extractEmailsFromUrl(url, deep, maxPagesPerUrl, extractSocial);
      allLeads.push(...leads);
    }

    const unique = new Map();
    for (const lead of allLeads) {
      if (!unique.has(lead.email)) {
        unique.set(lead.email, lead);
      }
    }

    res.json({ success: true, count: unique.size, leads: Array.from(unique.values()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const extractEmailsFromUrl = async (url, deep, maxPages, extractSocial) => {
  try {
    const results = [];
    const visited = new Set();
    const urlsToVisit = [url];

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const phoneRegex = /(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}/g;

    let pagesCrawled = 0;

    while (urlsToVisit.length > 0 && pagesCrawled < (deep ? maxPages : 1)) {
      const currentUrl = urlsToVisit.shift();
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const response = await axios.get(currentUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const text = $('body').text();

        const emails = text.match(emailRegex) || [];
        const phones = text.match(phoneRegex) || [];

        for (const email of emails) {
          if (!email.includes('test') && !email.includes('example') && !email.includes('noreply')) {
            results.push({
              email: email,
              phone: phones.length > 0 ? phones[0] : '',
              source: currentUrl,
              verified: email.includes('.com') || email.includes('.org'),
              sourceType: 'website'
            });
          }
        }

        if (extractSocial) {
          const socialLinks = extractSocialLinks($, currentUrl);
          for (const socialUrl of socialLinks) {
            try {
              const socialResponse = await axios.get(socialUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 8000
              });
              const socialText = cheerio.load(socialResponse.data)('body').text();
              const socialEmails = socialText.match(emailRegex) || [];
              const socialPhones = socialText.match(phoneRegex) || [];

              for (const email of socialEmails) {
                if (!email.includes('test') && !email.includes('example')) {
                  results.push({
                    email: email,
                    phone: socialPhones.length > 0 ? socialPhones[0] : '',
                    source: socialUrl,
                    verified: true,
                    sourceType: 'social',
                    socialLinks: socialLinks
                  });
                }
              }
            } catch (err) {
              console.log('Social page error:', err.message);
            }
          }
        }

        pagesCrawled++;

        if (deep) {
          $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/') && !href.includes('#')) {
              const fullUrl = new URL(href, currentUrl).href;
              if (!visited.has(fullUrl) && !urlsToVisit.includes(fullUrl)) {
                urlsToVisit.push(fullUrl);
              }
            }
          });
        }

      } catch (err) {
        console.log('Error crawling:', currentUrl, err.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Extraction error:', error);
    return [];
  }
};

const extractSocialLinks = ($, baseUrl) => {
  const socialPatterns = [
    /facebook\.com/,
    /linkedin\.com/,
    /instagram\.com/,
    /twitter\.com/,
    /x\.com/,
    /github\.com/,
    /youtube\.com/,
    /pinterest\.com/,
    /tiktok\.com/
  ];

  const links = [];
  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let fullUrl = href;
    if (href.startsWith('/')) {
      fullUrl = new URL(href, baseUrl).href;
    }

    for (const pattern of socialPatterns) {
      if (pattern.test(fullUrl) && !links.includes(fullUrl)) {
        links.push(fullUrl);
        break;
      }
    }
  });

  return links;
};
