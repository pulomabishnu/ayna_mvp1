import React from 'react';

const PRIVACY_HTML = `
<style>
  .privacy-policy-body [data-custom-class='body'], .privacy-policy-body [data-custom-class='body'] * { background: transparent !important; }
  .privacy-policy-body [data-custom-class='title'], .privacy-policy-body [data-custom-class='title'] * { font-family: Arial !important; font-size: 26px !important; color: #000000 !important; }
  .privacy-policy-body [data-custom-class='subtitle'], .privacy-policy-body [data-custom-class='subtitle'] * { font-family: Arial !important; color: #595959 !important; font-size: 14px !important; }
  .privacy-policy-body [data-custom-class='heading_1'], .privacy-policy-body [data-custom-class='heading_1'] * { font-family: Arial !important; font-size: 19px !important; color: #000000 !important; }
  .privacy-policy-body [data-custom-class='heading_2'], .privacy-policy-body [data-custom-class='heading_2'] * { font-family: Arial !important; font-size: 17px !important; color: #000000 !important; }
  .privacy-policy-body [data-custom-class='body_text'], .privacy-policy-body [data-custom-class='body_text'] * { color: #595959 !important; font-size: 14px !important; font-family: Arial !important; }
  .privacy-policy-body [data-custom-class='link'], .privacy-policy-body [data-custom-class='link'] * { color: #3030F1 !important; font-size: 14px !important; font-family: Arial !important; word-break: break-word !important; }
  .privacy-policy-body ul { list-style-type: square; }
  .privacy-policy-body ul > li > ul { list-style-type: circle; }
  .privacy-policy-body ul > li > ul > li > ul { list-style-type: square; }
  .privacy-policy-body ol li { font-family: Arial; }
  .privacy-policy-body table { border-collapse: collapse; width: 100%; }
  .privacy-policy-body h1, .privacy-policy-body h2, .privacy-policy-body h3 { margin: 0; }
</style>
<div data-custom-class="body">
<div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
<div><span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated May 04, 2026</span></span></strong></span></div>
<div><br></div>
<div style="line-height: 1.5;"><span style="color: rgb(89, 89, 89); font-size: 15px;"><span data-custom-class="body_text">This Privacy Notice for <strong>Ayna</strong> ("we," "us," or "our"), describes how and why we might access, collect, store, use, and/or share ("process") your personal information when you use our services ("Services"), including when you:</span></span></div>
<ul>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);">Visit our website at <a target="_blank" data-custom-class="link" href="https://aynamvp1.vercel.app/">https://aynamvp1.vercel.app/</a> or any website of ours that links to this Privacy Notice</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);">Engage with us in other related ways, including any marketing or events</span></li>
</ul>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span style="color: rgb(127, 127, 127);"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>.</span></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><strong><span style="font-size: 15px;"><span data-custom-class="heading_1"><h2>SUMMARY OF KEY POINTS</h2></span></span></strong></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong><em>This summary provides key points from our Privacy Notice. Use the table of contents below to find the section you are looking for.</em></strong></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Do we process any sensitive personal information?</strong> Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your health data, sexual orientation, and racial or ethnic origins. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by contacting us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>. We will consider and act upon any request in accordance with applicable data protection laws.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div id="toc" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infocollect"><span style="color: rgb(0, 58, 250);">1. WHAT INFORMATION DO WE COLLECT?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infouse"><span style="color: rgb(0, 58, 250);">2. HOW DO WE PROCESS YOUR INFORMATION?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#legalbases"><span style="color: rgb(0, 58, 250);">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#whoshare"><span style="color: rgb(0, 58, 250);">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</span></a></span></div>
<div style="line-height: 1.5;"><a data-custom-class="link" href="#ai"><span style="color: rgb(0, 58, 250);">5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</span></a></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#sociallogins"><span style="color: rgb(0, 58, 250);">6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#inforetain"><span style="color: rgb(0, 58, 250);">7. HOW LONG DO WE KEEP YOUR INFORMATION?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infosafe"><span style="color: rgb(0, 58, 250);">8. HOW DO WE KEEP YOUR INFORMATION SAFE?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infominors"><span style="color: rgb(0, 58, 250);">9. DO WE COLLECT INFORMATION FROM MINORS?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#privacyrights"><span style="color: rgb(0, 58, 250);">10. WHAT ARE YOUR PRIVACY RIGHTS?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#DNT"><span style="color: rgb(0, 58, 250);">11. CONTROLS FOR DO-NOT-TRACK FEATURES</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#uslaws"><span style="color: rgb(0, 58, 250);">12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</span></a></span></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#policyupdates"><span style="color: rgb(0, 58, 250);">13. DO WE MAKE UPDATES TO THIS NOTICE?</span></a></span></div>
<div style="line-height: 1.5;"><a data-custom-class="link" href="#contact"><span style="color: rgb(0, 58, 250); font-size: 15px;">14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</span></a></div>
<div style="line-height: 1.5;"><a data-custom-class="link" href="#request"><span style="color: rgb(0, 58, 250);">15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</span></a></div>
<div style="line-height: 1.5;"><br></div>

<div id="infocollect" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong>
<span data-custom-class="heading_2" id="personalinfo"><span style="font-size: 15px;"><strong><h3>Personal information you disclose to us</h3></strong></span></span>
<span style="color: rgb(89, 89, 89); font-size: 15px;"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We collect personal information that you provide to us.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> The personal information we collect may include: names, phone numbers, email addresses, usernames, passwords, contact preferences, billing addresses, debit/credit card numbers, and contact or authentication data.</span></span></div>
<div id="sensitiveinfo" style="line-height: 1.5;"><br><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information: health data, data about a person's sex life or sexual orientation, and information revealing race or ethnic origin.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number and the security code associated with your payment instrument. All payment data is handled and stored by <strong>Stripe</strong>. You may find their privacy notice at <a target="_blank" data-custom-class="link" href="http://stripe.com/privacy">http://stripe.com/privacy</a>.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing social media account details, like your Google account. If you choose to register in this way, we will collect certain profile information about you from the social media provider, as described in the section <a data-custom-class="link" href="#sociallogins" style="color: rgb(0, 58, 250);">HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a> below.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>Google API</h3></span></strong><span data-custom-class="body_text">Our use of information received from Google APIs will adhere to the <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy" rel="noopener noreferrer" target="_blank" style="color: rgb(0, 58, 250);">Google API Services User Data Policy</a>, including the <a data-custom-class="link" href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" rel="noopener noreferrer" target="_blank" style="color: rgb(0, 58, 250);">Limited Use requirements</a>.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="infouse" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>We process your personal information for a variety of reasons, including:</strong></span></span></div>
<ul>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To facilitate account creation and authentication and otherwise manage user accounts.</strong></span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To deliver and facilitate delivery of services to the user.</strong></span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To respond to user inquiries/offer support to users.</strong></span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To send administrative information to you.</strong></span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To request feedback.</strong> We may process your information when necessary to request feedback and to contact you about your use of our Services.</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To send you marketing and promotional communications.</strong> We may process the personal information you send to us for our marketing purposes, if this is in accordance with your marketing preferences. You can opt out of our marketing emails at any time.</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To post testimonials.</strong> We post testimonials on our Services that may contain personal information.</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To evaluate and improve our Services, products, marketing, and your experience.</strong></span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><strong>To identify usage trends.</strong> We may process information about how you use our Services to better understand how they are being used so we can improve them.</span></li>
</ul>
<div style="line-height: 1.5;"><br></div>

<div id="legalbases" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2></span></strong>
<em><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>In Short:</strong> We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfill our contractual obligations, to protect your rights, or to fulfill our legitimate business interests.</span></span></em></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;"><strong><u><em>If you are located in Canada, this section applies to you.</em></u></strong></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;">We may process your information if you have given us specific permission (i.e., express consent) to use your personal information for a specific purpose, or in situations where your permission can be inferred (i.e., implied consent). You can withdraw your consent at any time.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="whoshare" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We may share information in specific situations described in this section and/or with the following third parties.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">We may need to share your personal information in the following situations:</span></span></div>
<ul>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</span></li>
</ul>
<div style="line-height: 1.5;"><br></div>

<div id="ai" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2></span></strong>
<span style="font-size: 15px;"><strong><em><span data-custom-class="body_text">In Short:</span></em></strong><em><span data-custom-class="body_text"> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</span></em></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="body_text">Use of AI Technologies</span></strong></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">We provide the AI Products through third-party service providers ("AI Service Providers"), including <strong>Anthropic</strong>. As outlined in this Privacy Notice, your input, output, and personal information will be shared with and processed by these AI Service Providers to enable your use of our AI Products. You must not use the AI Products in any way that violates the terms or policies of any AI Service Provider.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="body_text">Our AI Products</span></strong></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">Our AI Products are designed for the following functions:</span></span></div>
<ul><li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">AI-powered health product recommendations and insights</span></li></ul>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="body_text">How We Process Your Data Using AI</span></strong></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="body_text">How to Opt Out</span></strong></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">To opt out of AI processing, you can:</span></span></div>
<ul>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Log in to your account settings and update your user account</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;">Contact us using the contact information provided</span></li>
</ul>
<div style="line-height: 1.5;"><br></div>

<div id="sociallogins" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> If you choose to register or log in to our Services using a social media account, we may have access to certain information about you.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">Our Services offer you the ability to register and log in using your third-party social media account details (like your Google account). Where you choose to do this, we will receive certain profile information about you from your social media provider. The profile information we receive may vary depending on the social media provider concerned, but will often include your name, email address, and profile picture.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We will use the information we receive only for the purposes that are described in this Privacy Notice. Please note that we do not control, and are not responsible for, other uses of your personal information by your third-party social media provider. We recommend that you review their privacy notice to understand how they collect, use, and share your personal information.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="inforetain" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>7. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law. No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible, then we will securely store your personal information and isolate it from any further processing until deletion is possible.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="infosafe" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>8. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We aim to protect your personal information through a system of organizational and technical security measures.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. You should only access the Services within a secure environment.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="infominors" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>9. DO WE COLLECT INFORMATION FROM MINORS?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We do not knowingly collect data from or market to children under 18 years of age.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="privacyrights" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>10. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> Depending on your state of residence in the US or in some regions such as Canada, you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">In some regions (like Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; (iv) if applicable, to data portability; and (v) not to be subject to automated decision-making. You can make such a request by contacting us using the contact details provided in the section <a data-custom-class="link" href="#contact" style="color: rgb(0, 58, 250);">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div id="withdrawconsent" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, you have the right to withdraw your consent at any time by contacting us using the contact details provided in the section <a data-custom-class="link" href="#contact" style="color: rgb(0, 58, 250);">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong><u>Opting out of marketing and promotional communications:</u></strong> You can unsubscribe from our marketing and promotional communications at any time by clicking on the unsubscribe link in the emails that we send, or by contacting us using the details provided in the section <a data-custom-class="link" href="#contact" style="color: rgb(0, 58, 250);">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a> below.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Account Information</h3></strong></span><span data-custom-class="body_text">If you would at any time like to review or change the information in your account or terminate your account, you can log in to your account settings and update your user account, or contact us using the contact information provided.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;">If you have questions or comments about your privacy rights, you may email us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="DNT" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">California law requires us to let you know how we respond to web browser DNT signals. Because there currently is not an industry or legal standard for recognizing or honoring DNT signals, we do not respond to them at this time.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="uslaws" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> If you are a resident of California, Colorado, Connecticut, Delaware, Florida, Indiana, Iowa, Kentucky, Maryland, Minnesota, Montana, Nebraska, New Hampshire, New Jersey, Oregon, Rhode Island, Tennessee, Texas, Utah, or Virginia, you may have the right to request access to and receive details about the personal information we maintain about you and how we have processed it, correct inaccuracies, get a copy of, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>Your Rights</h3></span></strong><span data-custom-class="body_text">You have rights under certain US state data protection laws. However, these rights are not absolute, and in certain cases, we may decline your request as permitted by law. These rights include:</span></span></div>
<ul>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to know</strong> whether or not we are processing your personal data</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to access</strong> your personal data</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to correct</strong> inaccuracies in your personal data</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to request</strong> the deletion of your personal data</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to obtain a copy</strong> of the personal data you previously shared with us</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to non-discrimination</strong> for exercising your rights</span></li>
  <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><strong>Right to opt out</strong> of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</span></li>
</ul>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>How to Exercise Your Rights</h3></span></strong><span style="color: rgb(89, 89, 89);"><span data-custom-class="body_text">To exercise these rights, you can contact us by emailing us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>, or by referring to the contact details at the bottom of this document.</span></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>Request Verification</h3></span></strong><span data-custom-class="body_text">Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. We will only use personal information provided in your request to verify your identity or authority to make the request.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>Appeals</h3></span></strong><span data-custom-class="body_text">Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may submit a complaint to your state attorney general.</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px;"><strong><span data-custom-class="heading_2"><h3>California "Shine The Light" Law</h3></span></strong><span data-custom-class="body_text">California Civil Code Section 1798.83, also known as the "Shine The Light" law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us by using the contact details provided in the section <a data-custom-class="link" href="#contact" style="color: rgb(0, 58, 250);">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="policyupdates" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>13. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><em><strong>In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="contact" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">If you have questions or comments about this notice, you may contact our Data Protection Officer (DPO) by email at <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>, by phone at 9786540921, or contact us by post at:</span></span></div>
<div style="line-height: 1.5;"><br></div>
<div style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">Ayna<br>Data Protection Officer<br>252 Beacon Street<br>Andover, MA 01810<br>United States</span></span></div>
<div style="line-height: 1.5;"><br></div>

<div id="request" style="line-height: 1.5;"><strong><span data-custom-class="heading_1"><h2>15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong>
<span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">You have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please visit: <a target="_blank" data-custom-class="link" href="mailto:pulomabishnu@gmail.com">pulomabishnu@gmail.com</a>.</span></span></div>
</div>
`;

export default function PrivacyPolicy({ onBack }) {
  return (
    <section className="container animate-fade-in-up" style={{ padding: 'var(--spacing-xl) var(--spacing-md)', maxWidth: '860px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.9rem', marginBottom: '1.5rem', padding: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
      >
        ← Back
      </button>
      <div
        className="privacy-policy-body"
        dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }}
      />
    </section>
  );
}
