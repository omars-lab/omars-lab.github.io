---
slug: /craft/product-management/pocs/enhancing-the-google-search-experience
title: Enhancing the Google Search Experience
sidebar_label: 'Google Search Experience'
description: 'A proof of concept exploring ways to improve Google search results, especially the SGE Generative AI Responses.'
authors: [oeid]
tags: [pocs, google-search, browser-extension, ai-filtering, search-optimization, user-experience, seo, sge]
draft: false
---

# Enhancing the Google Search Experience

## Purpose of POC

I want to see what it will take to change what google says about my website(s). In the [Before Changes](#before-changes) section, we see the google search results prior to my changes along with observations. In the [After Changes](#after-changes) section, we should how google behaves after the SEO/SGE focused updates to improve the experience.

## Before Changes

![image of google search before my changes](/img/pocs/before-seo.png)

### Initial Search Results Analysis

**Search Query**: "What is the bytesofpurpose site about"

**Key Observations:**
- **Limited Brand Recognition**: Google's results showed no awareness of the site owner or personal brand
- **Generic Content Focus**: Results were primarily focused on the technical blog content without connecting it to a specific person
- **Missing Portfolio Integration**: No mention of the portfolio or resume hosted on the same domain
- **Docusaurus Default SEO**: Results reflected the out-of-the-box Docusaurus SEO without personalization
- **No Personal Attribution**: Search results didn't identify who was behind the content or site

**Technical Issues Identified:**
- Lack of structured data for personal branding
- Missing author information in search results
- No connection between blog content and professional portfolio
- Generic meta descriptions without personal context
- Insufficient internal linking between different site sections

**Search Result Quality:**
- Results were technically accurate but lacked personal context
- No mention of the site owner's expertise or background
- Generic descriptions that could apply to any technical blog
- Missing professional credibility indicators

* [Google Search: What is the bytesofpurpose site about](https://www.google.com/search?q=What+is+the+bytesofpurpose+site+about)
* [Google Search: site:bytesofpurpose.com](https://www.google.com/search?q=site%3Abytesofpurpose.com)


## Changes

* [x] Improved SEO on my blog ([plan](https://github.com/omars-lab/omars-lab.github.io/blob/master/bytesofpurpose-blog/prompts/plans/seo-improvement-plan.md)) ([commit](https://github.com/omars-lab/omars-lab.github.io/commit/e3cacacea5d2c4ae4ae11ec1598a763a70d887e6))
* [x] Imrpoved SEO on my portfolio ([plan](https://github.com/omars-lab/portfolio/blob/v2-react/docs/plans/SEO_IMPROVEMENT_PLAN.md)) ([commit](https://github.com/omars-lab/portfolio/commit/bdc811d52a414e395e97c3e07b4637eab84e6718))

## After Changes

![image of google search after my changes](/img/pocs/after-seo.png)

### Improved Search Results Analysis

**Search Query**: "What is the bytesofpurpose site about"

**Key Improvements Achieved:**
- **Personal Brand Recognition**: Google now clearly identifies the site owner by name in search results
- **Integrated Professional Identity**: Search results now connect the blog content with the portfolio and resume
- **Enhanced Context Understanding**: Google demonstrates awareness of the site's dual purpose (blog + portfolio)
- **Professional Attribution**: Results now attribute content to a specific individual rather than generic blog
- **Cross-Section Linking**: Google recognizes the relationship between different sections of the site

**Technical Improvements Realized:**
- **Structured Data Integration**: Author information and personal branding now appear in search results
- **Enhanced Meta Descriptions**: Personalized descriptions that include professional context
- **Improved Internal Linking**: Google now understands the connection between blog and portfolio content
- **Author Schema Implementation**: Proper author attribution in search results
- **Professional Context**: Search results now reflect the site's professional purpose

**Search Result Quality Enhancement:**
- **Personal Context**: Results now provide personal context about the site owner
- **Professional Credibility**: Search results establish professional expertise and background
- **Comprehensive Site Understanding**: Google now recognizes the full scope of the site's content
- **Brand Coherence**: Consistent messaging across different site sections in search results
- **Professional Attribution**: Clear identification of the content creator and their expertise

**Measurable Impact:**
- **Brand Visibility**: Site owner's name now appears in search results
- **Professional Recognition**: Google associates the site with a specific professional identity
- **Content Attribution**: Clear connection between content and its creator
- **Site Cohesion**: Google understands the relationship between blog and portfolio sections
- **Professional Authority**: Search results establish the site owner as a credible professional

* [Google Search: What is the bytesofpurpose site about](https://www.google.com/search?q=What+is+the+bytesofpurpose+site+about)
* [Google Search: what is bytesofpurpose website about](https://www.google.com/search?q=what+is+bytesofpurpose+website+about)


## Background
* [blog.google — Generative Ai Search](https://blog.google/products/search/generative-ai-search/)
- [Google Search Central](https://developers.google.com/search)
	- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
		- [Control how Google crawls and indexes your site](https://developers.google.com/search/docs/fundamentals/get-started#crawling_indexing)
	- [Crawling and Indexing](https://developers.google.com/search/docs/crawling-indexing)
		- [Link Best practices by google](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)

## Deep Dives

* How do we test how google views our website?
	* [support.google.com — 9012289](https://support.google.com/webmasters/answer/9012289)
	* [search.google.com — Inspect](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Abytesofpurpose.com&id=3ss7ng-Bbbjs7zpTEDbtTA&alt_id=njgBsHfedFr3vU9Rignrxg&panel_tab=2)
    * [search.google.com — Insights](https://search.google.com/search-console/performance/insights?resource_id=sc-domain%3Abytesofpurpose.com)
* How do educate google on our site / give it content to use when formulating a search result / SGE response? 
    * [developers.google.com — Visual Elements Gallery](https://developers.google.com/search/docs/appearance/visual-elements-gallery)
    * [developers.google.com — Snippet](https://developers.google.com/search/docs/appearance/snippet#meta-descriptions)
    * [developers.google.com — Profile Page](https://developers.google.com/search/docs/appearance/structured-data/profile-page)


# Motviation
* [ ] I should do a proof of concept updating the auto generated response for my website
* [ ] [semrush.com — Google Sge](https://www.semrush.com/blog/google-sge/)
* [ ] [google.com — Search](https://www.google.com/search?q=what+os+the+bytesofpurose+website+about)