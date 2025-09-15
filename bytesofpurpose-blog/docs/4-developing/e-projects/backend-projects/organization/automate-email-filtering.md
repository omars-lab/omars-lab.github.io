# a8n: Email Automation
* [ ] add yahoo email inbox analytics to find the most recurring domain - scroll with selenium
mail-app-component-container
//*[@id="mail-app-component"]/div[1]/div/div/div[2]/div/div[1]/div[3]/div/div[1]/ul

<strong data-test-id="senders-bold" class="u_Z13VSE6">The Children’s Place</strong>
//*[@id="mail-app-component"]/div[1]/div/div/div[2]/div/div[1]/div[3]/div/div[1]/ul/li[54]/a/div/div[1]/div[3]/span/strong

<span class="o_h J_x em_N G_e" role="gridcell" title="thechildrensplace@promo.childrensplace.com" data-test-id="senders_list"><strong data-test-id="senders-bold" class="u_Z13VSE6">The Children’s Place</strong></span>


# Filtering Email

* [ ] https://mail.yahoo.com/d/search/keyword=from%253AJockey%2520in%253Ainbox
* [ ] https://mail.yahoo.com/d/search/keyword=from%253Afavordelivery%2520in%253Ainbox
* [ ] https://mail.yahoo.com/d/search/keyword=from%253Agap.com%2520in%253Ainbox

* [ ] Make a tamper monkey script to inject buttons to delete filters / move them up / etc for yahoo filters ...
	* https://stackoverflow.com/questions/25440686/press-delete-key-using-javascript
	* https://api.jquery.com/attribute-equals-selector/
	* https://www.codegrepper.com/code-examples/javascript/javascript+sleep+in+foreach+loop
	
	$( "button[data-test-id='delete-filter']" ).click();
	$( "button[data-test-id='move-filter-up']" ).click();
	$( "button[data-test-id='move-filter-down']" ).click()
	
	const jquery = $; Array(500).fill().forEach( (e, i) => { 
	    setTimeout(() => { jquery("button[data-test-id='move-filter-down']").click(); }, I * 750); 
	    setTimeout(() => { const b = jquery("button[data-test-id='icon-btn-close_mini']") ; b ? b.click() : null; }, I * 1250); 
	    setTimeout(() => { const b = jquery("button[data-test-id='icon-btn-close_mini']") ; b ? b.click() : null; }, I * 1500); 
	} );



-------------------------

# Email Filters

* [ ] Create Mail filters for receipts specifically 

https://mail.yahoo.com/d/search/keyword=from%253A%2540email.theparkingspot.com%2520in%253Ainbox

* [ ] Unsubscribed: 
	* [ ] https://mail.yahoo.com/d/search/keyword=from%253A%2540simplilearnmailer.com%2520in%253Ainbox
	* [ ] https://mail.yahoo.com/d/search/keyword=from%253A%2540theshadestore.com
	* [ ] https://mail.yahoo.com/d/search/keyword=from%253A.blinds.com%2520in%253Ainbox
* [ ] Manually Move Always
* https://mail.yahoo.com/d/search/keyword=from%253Aemail.informeddelivery.usps.com
* https://mail.yahoo.com/d/search/keyword=from%253A%2540ups.com%2520in%253Ainbox
* https://mail.yahoo.com/d/search/keyword=from%253A%2540icbrushycreek.org%2520in%253Ainbox
* https://mail.yahoo.com/d/search/keyword=from%253A%2540chase.com%2520in%253Ainbox
* https://mail.yahoo.com/d/search/keyword=from%253A%2540smarthub.coop%2520in%253Ainbox
* https://mail.yahoo.com/d/search/keyword=from%253A.hilton.com
* https://mail.yahoo.com/d/search/keyword=from%253A%2540email.theparkingspot.com%2520in%253Ainbox
* Feedback: https://mail.yahoo.com/d/search/keyword=from%253A%2540gettattle.com%2520in%253Ainbox
* Food Orders: https://mail.yahoo.com/d/search/keyword=from%253A%2540olo.com%2520in%253Ainbox
* https://mail.yahoo.com/d/search/keyword=from%253A%2540toasttab.com%2520in%253Ainbox
# Need Filters
https://mail.yahoo.com/d/search/keyword=from%253A.hilton.com
https://mail.yahoo.com/d/search/keyword=from%253A.hiltongrandvacations.com%2520in%253Ainbox
Spam 

https://mail.yahoo.com/d/search/keyword=from%253A.capitalone.com%2520in%253Ainbox
globalpanmedia.com

# Bills
https://mail.yahoo.com/d/search/keyword=from%253A%2540invoicecloud.net%2520in%253Ainbox


# Daycare 
https://mail.yahoo.com/d/search/keyword=from%253A%2540tadpoles.com%2520in%253Ainbox
# Accounts 
https://mail.yahoo.com/d/search/keyword=from%253Ajcpenney&folders=1
## SPam 
https://mail.yahoo.com/d/search/keyword=from%253A%2540thejokebox.com%2520in%253Ainbox



* [ ] [Chase Emails](https://mail.yahoo.com/d/search/keyword=from%253Ano.reply.alerts%2540chase.com%2520OR%2520from%253Ano-reply%2540alertsp.chase.com%2520OR%2520from%253Achase%2540e.chase.com%2520OR%2520from%253Achase%2540fraudalert.chase.com%2520OR%2520from%253Acustomer.satisfaction%2540experience.chase.com%2520OR%2520from%253Asmrfs%2540emailonline.chase.com%2520OR%2520from%253Achasedonotreply%2540creditjourney.chase.com%2520OR%2520from%253Asmpfs%2540emailonline.chase.com%2520OR%2520from%253Achaseonline%2540emailonline.chase.com%2520OR%2520from%253Achase%2540notify.chase.com%2520OR%2520from%253Achase%2540fraudprevention.chase.com%2520OR%2520from%253Achase.fraud.prevention%2540info.chase.com%2520OR%2520from%253Achase%2540activityconfirmation.chase.com&folders=1)



# Cleaning Up Email

# Cleaning Up Email 
* Setup filters
	* https://mail.yahoo.com/d/search/keyword=from%253A*officedepot.com%2520in%253Ainbox
	* $$('#mail-app-component > div > section > div > article > div > div > div > div > ol > li > div > div > div > div > span').map(x => x.innerHTML.replace('From contains \"', '').replace('From ends with \"', '').replace('\"', '').replace(/[^@]*@/, '').replace(/^[.]/, '').replace(/^e?m?[.]/ ,'').replace(/^e?[-]?mail[0-9]?(er)?s?[.]/ ,'').replace(/^((sg)|(s)|(r)|(p)|(news)|(my)|(mg)|(mc)|(e2)|(e-offers)|(c)|(ce)|(e2))./, '').replace(/^info[0-9]?./, ''))
	* pbpaste | jq -r 'sort|.[]' | sort  | uniq -c | sort | wc -l
	- https://stackoverflow.com/questions/14308588/simple-jquery-selector-only-selects-first-element-in-chrome
	- Filters to clean up 
		-    2 apartmentlist.com
   2 arbucks.com
   2 deeplearning.ai
   2 defights.com
   2 diamondsdirect.com
   2 email-marriott.com
   2 emiumoutlets.com
   2 er1.com
   2 github.com
   2 icut.com
   2 ihg.com
   2 invisionapp.com
   2 katespade.com
   2 linkedin.com
   2 macys.com
   2 nextdoor.com
   2 nordstromrack.com
   2 qa.org
   2 rsonalcapital.com
   2 tommy.com
   2 umrelief.org
   2 us-news.adidas.com
   2 us.levi.com
   2 wolfram.com
   2 yahoo-email.com
   3 appa.com
   3 fitbit.com
   4 ivaterelay.appleid.com

- [ ] Clean up duplicative filters ...
	- [ ]  pbpaste | jq sort
