what is anvil and what is alix, are they the same company, be very clear and straightforwardsd
Worked for 40s

For the San Francisco startups Anvil (useanvil.com) and Alix (meetalix.com):

Anvil sells document software to other companies. Developers use its APIs to collect information, fill or generate PDFs, and obtain electronic signatures inside their own apps. Think of it as infrastructure for building paperwork-heavy products.

Alix helps families settle someone’s estate after they die. It coordinates probate, taxes, bills, property, asset transfers, attorneys and accountants, while families track the process through an app.

They are not the same company.

Anvil: software infrastructure for businesses.
Alix: an estate-settlement service for families.
They have different founders, investors, products and customers.

They both deal with complicated paperwork, which is probably why they can sound similar.

i dont get Anvil, explain how PDFs is a business people pay for

Businesses are not paying Anvil just to create a PDF. They are paying Anvil to automate paperwork that would otherwise require employees, custom engineering and separate signing software.

Simple example: an insurance company

A customer applies for insurance on the company’s website and enters:

Their name
Address
Business details
Coverage choices

The insurance company still needs to produce an official application document, disclosure forms and a signed policy.

Without Anvil:

An employee copies the customer’s information into several PDFs.
The employee emails the documents.
The customer signs them.
The employee downloads and stores the signed copies.
Someone corrects mistakes when fields are missing.

With Anvil:

The customer completes the website form.
The insurance company sends that data to Anvil.
Anvil automatically puts the information into the correct places in the official PDFs.
Anvil sends the documents for signature.
The signed documents return to the insurance company’s system.

Anvil’s API literally lets a company send structured data and receive a completed PDF.

Why not just build this themselves?

PDF forms are surprisingly difficult to automate. Every form has different fields, checkboxes, pages and signature locations. Government forms and legal documents may also have to maintain an exact layout.

Anvil handles:

Filling existing PDF templates
Creating new PDFs from website data
Collecting legally binding electronic signatures
Tracking who signed and when
Embedding the entire process inside the company’s app

Common customers would include insurance, healthcare, banking, real estate, HR and legal-software companies because their businesses still depend on official forms, contracts and disclosures.

What exactly are customers purchasing?

They are purchasing document infrastructure, not PDFs.

It is similar to:

Stripe: companies pay it to handle payments.
Twilio: companies pay it to send texts and calls.
Anvil: companies pay it to generate, fill and sign documents.

Anvil currently lists usage pricing such as $0.10 per PDF filled or generated and $1.50 per completed electronic-signature packet.

So the business is essentially:

“Give us your customer data and document templates. We will turn them into accurate, completed and signed paperwork automatically.”

Worked for 1m 24s

Anvil’s core technology is best understood as a document compiler.

It has two main pipelines:

Existing PDF + field map + JSON data
                    ↓
               Filled PDF
HTML/CSS or Markdown
          ↓
      Newly generated PDF

Anvil does not publicly disclose every internal library it uses, so I will separate what is confirmed from what can be inferred.

1. PDF templates: a PDF plus a coordinate map

When you upload a PDF, Anvil stores two things:

The original PDF file.
Metadata describing where information should be placed.

Anvil calls this template configuration a Cast. Each field has information such as:

{
  "alias": "customer.fullName",
  "page": 0,
  "type": "fullName",
  "rectangle": {
    "x": 72,
    "y": 140,
    "width": 180,
    "height": 24
  },
  "fontSize": 10
}

That is a representative example, not Anvil’s exact internal database format.

The important fields are:

Page: which page the field belongs to.
X and Y: where the field starts.
Width and height: the box available for the content.
Type: text, date, money, checkbox, image, signature and so on.
Alias: the stable name the developer uses, such as customer.fullName.

Anvil’s public API explicitly represents document fields using rectangles containing x, y, width and height. Its Cast object defines where boxes exist on PDF pages and what types of information belong in them.

So the template builder is essentially a visual editor for creating this coordinate map:

Human draws a rectangle over “Full legal name”
                         ↓
Anvil records:
page 1, x=72, y=140, width=180, height=24
                         ↓
Developer names it:
customer.fullName

The PDF itself does not change every time. The reusable field map is what makes it a template.

2. How Anvil finds fields automatically

Some PDFs already contain native fillable fields called AcroForm fields. In that case, Anvil can read the field definitions already stored inside the PDF.

For an ordinary or scanned PDF, Anvil’s Document AI has three stages:

1. Find visible empty boxes
2. Read nearby labels and infer field types
3. Match those fields to the customer’s data schema

For example, it might see:

Date of birth: __________________

Then produce something resembling:

Rectangle: x=230, y=410, width=120, height=20
Label: Date of birth
Type: date
Alias: applicant.dateOfBirth

Anvil says its first AI stage finds boxes, including on scanned or non-fillable PDFs. Its second stage reads labels and determines whether a field is a date, text box, signature or something else. Its third stage uses descriptions supplied by the developer to map those fields to stable aliases.

Technically, that likely requires a combination of:

PDF page rendering
Computer vision for box detection
OCR or document-text extraction
Spatial reasoning between labels and boxes
A language model or semantic model for schema matching

Anvil confirms the stages, but it does not publicly name the exact vision, OCR or language models powering them.

3. What happens when the PDF Filling API is called

The developer sends a request like:

POST /api/v1/fill/template_123.pdf
{
  "data": {
    "customer.fullName": "Sarah Jones",
    "customer.dateOfBirth": "1996-04-18",
    "loan.amount": 24000,
    "terms.accepted": true
  }
}

Anvil then performs a mostly deterministic pipeline.

Step 1: Load the template

Anvil retrieves:

Original PDF
+
Cast field configuration
Step 2: Match JSON keys to aliases

Anvil searches the template for:

customer.fullName
customer.dateOfBirth
loan.amount
terms.accepted

Keys with no matching template field are ignored. Missing values leave the corresponding document fields untouched.

Step 3: Format each value

The field type determines how the raw data is displayed.

For example:

1996-04-18

might become:

04/18/1996

And:

24000

might become:

$24,000.00

A Boolean value could become a checkmark. A phone number might be split across several boxes. A full address object might be separated into street, city, state and ZIP fields.

Anvil’s template types include formatting rules for dates, numbers, dollar amounts, phone numbers, names, addresses and other compound values.

Step 4: Fit the content into the rectangle

The document engine must determine:

Font
Font size
Alignment
Line wrapping
Whether text needs to shrink
Where a checkmark should be drawn
How an image or signature should be scaled

For example:

Rectangle width: 180 points
Text: “Sarah Elizabeth Montgomery-Jones”

The engine has to measure the text using the selected font and decide whether to wrap, shrink or clip it.

Step 5: Modify the PDF

A PDF page is ultimately a collection of drawing instructions:

Draw this text using this font at these coordinates.
Draw this image inside this rectangle.
Draw this line from point A to point B.

Anvil can therefore add new drawing instructions on top of the original page.

Conceptually:

Original page
+
“Sarah Jones” at x=72, y=140
+
Checkmark at x=315, y=420
+
Signature image at x=90, y=650
=
Filled page

For a normal flattened result, these additions become part of the page’s visual content. For an interactive result, Anvil can preserve or create native AcroForm fields, allowing someone to continue typing into the document in Adobe Acrobat or another PDF viewer. Anvil’s API supports both normal filled output and interactive PDF fields.

Step 6: Serialize the PDF

The engine rebuilds the PDF’s internal object structure, cross-reference information, fonts, pages and annotations, then returns the final binary PDF bytes in the HTTP response. Anvil can also duplicate pages, repeat tables and merge repeated instances of a template into one output document.

The public docs do not name the exact PDF-writing library Anvil uses for this operation.

4. PDF generation is a different technology

The PDF Generation API does not begin with an existing PDF.

Instead, the developer provides:

{
  "type": "html",
  "data": {
    "html": "<h1>Invoice</h1><p>Customer: Sarah Jones</p>",
    "css": "h1 { font-size: 24px; }"
  }
}

Anvil then runs a document-layout engine.

HTML
 ↓
Parse elements
 ↓
Apply CSS
 ↓
Calculate widths and heights
 ↓
Break content into pages
 ↓
Position text, tables and images
 ↓
Write PDF drawing instructions
 ↓
Return PDF bytes

The difficult technology here is pagination.

A browser normally has one continuously scrolling page. A PDF has fixed page boundaries. Anvil’s renderer must decide:

Where a paragraph splits
Whether a table row can split
When to repeat table headers
Where a forced page break occurs
How headers and footers repeat
Where page numbers are placed
How many total pages exist

Anvil supports paged-document CSS features such as page breaks, running header and footer elements, page counters, named pages and repeating table headers.

5. Is Anvil using Chrome or Puppeteer?

Probably not for its main HTML renderer, although Anvil has not officially confirmed the exact engine.

There are two strong clues:

Anvil’s documentation says CSS Flexbox and Grid are not supported.
It supports the special property -fs-table-paginate.

The -fs- prefix is associated with the Flying Saucer/OpenHTMLtoPDF family of paged HTML-to-PDF renderers. That technology is designed around CSS print layout rather than reproducing a modern Chrome browser exactly.

Therefore, my informed inference is:

Anvil likely uses, modifies or has built around a Flying Saucer/OpenHTMLtoPDF-style rendering engine.

That is not publicly confirmed, so I would not state “Anvil uses OpenHTMLtoPDF” as a fact.

It is clearly not merely taking a screenshot of a webpage. It performs real document pagination and produces text, fonts, tables and form elements inside the PDF.

6. What happens with React or Vue?

Anvil does not run an entire React application inside the PDF endpoint.

The customer renders the React component into a static HTML string:

React component
      ↓
ReactDOMServer.renderToStaticMarkup()
      ↓
HTML string + CSS string
      ↓
Anvil
      ↓
PDF

Anvil’s endpoint accepts vanilla HTML and CSS. React, Vue, Handlebars or another framework is used by the customer to produce that HTML before sending it to Anvil.

7. How Markdown generation probably works

For Markdown input, the pipeline is likely:

Structured Markdown
        ↓
Parse Markdown tokens
        ↓
Convert into document blocks or HTML
        ↓
Apply fonts, margins and styles
        ↓
Run pagination
        ↓
Render PDF

Anvil’s Markdown API accepts structured blocks for text, tables, images and formatting, while the HTML API accepts direct HTML and CSS. Both eventually need to pass through a layout and PDF-writing system.

8. E-signature technology

E-signatures add another technical layer.

Anvil first places signature fields using the same page-and-rectangle system. After someone signs, Anvil:

Hashes the document
        ↓
Signs the hash using a private cryptographic key
        ↓
Embeds the certificate and signed hash into the PDF
        ↓
Allows PDF viewers to detect later modifications

Anvil says its signing process uses public-key infrastructure, certificate-authority-issued document certificates and keys stored in hardware security modules.

That is different from merely pasting an image of someone’s handwriting onto the PDF. The visible signature is an image or drawing. The digital signature is the cryptographic proof that the finished file has not been modified.

The simplest technical summary
Anvil product	Main underlying technology
PDF templates	PDF parsing plus coordinate-based field metadata
Document AI	Box detection, document reading and semantic schema mapping
PDF filling	Data formatting plus PDF content/AcroForm manipulation
PDF generation	HTML/Markdown parsing, CSS layout, pagination and PDF rendering
E-signatures	Field placement, identity/event tracking, hashing, PKI and certificates
APIs	REST for filling/generation and GraphQL for managing templates and workflows

So Anvil’s valuable technology is not “making PDFs.”

It is this complete engine:

Understand a document
        ↓
Represent its fields as structured metadata
        ↓
Connect those fields to a company’s data model
        ↓
Lay out or insert the data correctly
        ↓
Generate a valid, secure PDF
        ↓
Optionally collect and cryptographically seal signatures
ok, cool now explain Alix to me, are they using AI, if yes, in what way?
Worked for 34s

Yes, Alix uses AI. But Alix is not primarily selling an AI chatbot or software license.

Alix is an estate-settlement company that combines software, AI agents and human specialists to actually close a deceased person’s estate.

What does Alix actually do?

Suppose your parent dies and names you executor. You may need to:

Find every bank, retirement and investment account
Identify debts and unpaid bills
File probate documents
Contact banks, insurers, creditors and government agencies
Cancel subscriptions and utilities
Transfer the house and vehicles
File final tax returns
Keep beneficiaries updated
Create a complete accounting of every dollar
Distribute the remaining assets

A lawyer normally handles only the legal portion. You still have to coordinate everything else.

Alix assigns you a Settlement Specialist, gives your family an app for tracking progress and coordinates lawyers, CPAs and other professionals where necessary. Alix says it handles the operational process from asset discovery through probate closure and distribution.

A concrete Alix workflow

Imagine your mother dies.

1. Alix gathers the estate information

You give Alix:

Death certificate
Will or trust
Bank statements
Tax returns
Mail
Property documents
Insurance documents
Information about family members

The system creates a central record of:

People
Assets
Debts
Documents
Institutions
Deadlines
Required actions

Your Settlement Specialist reviews the case and builds a settlement plan.

2. Alix finds what needs to be done

Based on the estate and its state, Alix determines that it may need to:

File the probate petition
Notify beneficiaries
Publish a creditor notice
Contact the deceased’s bank
Request IRS transcripts
Locate an old 401(k)
Value the house
Cancel utilities
Transfer the vehicle
Prepare estate accounting
File final taxes
Distribute assets
Close probate

This is where Alix’s system becomes valuable: every estate can involve hundreds of connected tasks, with different rules, documents, institutions and deadlines. Alix presents the family with progress and documents through its app while its internal team executes the work.

Where exactly does AI appear?

Alix does not publish a detailed technical architecture, but it explicitly says it uses automation, artificial intelligence, machine learning and human care. Its CEO has said the administrative workload is handled by “agentic AI and humans,” and the company has hired roles such as Agent Systems Engineer and AI Agent Product Manager.

Based on Alix’s published claims, the AI appears to be used in five major areas.

1. Reading and organizing documents

An estate can contain hundreds of unstructured documents:

Bank statements
Medical bills
Tax returns
Life-insurance letters
Deeds
Vehicle titles
Retirement statements
Court notices
Creditor letters

AI can read these documents and extract structured information:

Institution: Fidelity
Account type: 401(k)
Account ending: 4832
Owner: Patricia Jones
Estimated value: $128,400
Beneficiary: Unknown
Next action: Contact plan administrator

The likely technologies are document OCR, classification, information extraction and large language models. Alix does not publicly disclose which models or document-processing vendors it uses, so the exact implementation is unknown.

2. Asset discovery

Alix specifically describes AI-powered asset discovery.

Its system can combine clues from:

Uploaded statements and tax returns
Physical mail
Public records
Government databases
Credit-reporting information
Information from financial institutions
Unclaimed-property records

It can then cross-reference names, addresses, employers and institutions to identify possible assets the family did not know existed. Alix says its discovery process can uncover dormant accounts, retirement plans, vehicles, insurance, uncashed checks and other property.

For example:

Tax return shows dividend income from Vanguard
                 ↓
No Vanguard account exists in the estate inventory
                 ↓
System flags a possible missing brokerage account
                 ↓
Specialist investigates and contacts Vanguard

The AI does not magically access every bank account in America. It searches available sources, interprets evidence and flags leads for the Alix team to verify.

3. Creating and managing the estate’s task plan

This is probably the most important use of agentic AI.

Alix can represent an estate as a long workflow with dependencies:

Obtain death certificate
        ↓
File probate petition
        ↓
Executor receives authority
        ↓
Contact financial institutions
        ↓
Collect and value assets
        ↓
Resolve creditor claims
        ↓
Prepare taxes and accounting
        ↓
Distribute assets
        ↓
Close probate

The AI system can determine:

Which tasks apply to this estate
What information each task requires
Which tasks are blocked
What deadlines are approaching
Which documents are missing
Which person should perform the next action
Whether a human needs to intervene

This is not merely a to-do list. The system has to maintain the state of a case that may continue for more than a year.

The company says its agentic-AI strategy is intended to onboard executors faster, remove delays and connect estate settlement with other parts of the financial system.

4. Performing repetitive administrative work

Alix’s founder says AI agents and humans jointly handle tasks such as:

Reviewing bills
Scanning documents
Completing forms
Managing life-insurance work
Cancelling accounts and subscriptions
Communicating with financial institutions

An AI agent might prepare an action like:

Task: Close deceased customer’s utility account

Required information:
- Account number
- Death certificate
- Executor authorization
- Service address

Agent actions:
1. Find the correct utility procedure
2. Prepare the request
3. Attach the required documents
4. Draft the communication
5. Submit or route it to a human for approval
6. Track the response
7. Update the estate record

Some steps can be automated digitally. Others still require a human to call an institution, sign something, physically inspect property or make a legally significant decision.

5. Producing updates and maintaining records

As work happens, the system can turn operational events into understandable family updates:

Raw operational event:
Vanguard acknowledged receipt of executor documents.
Review expected within 10 business days.

Family-facing update:
We submitted the documents needed to access the Vanguard
account. Vanguard is reviewing them, and no action is currently
required from you.

The app shows milestones, open work and important documents to the executor and beneficiaries. The public material does not confirm whether every update is AI-generated, but summarization and case-record maintenance are natural applications of its agent system. The app itself is confirmed; the exact generation mechanism is not.

What the AI does not replace

The AI is not supposed to independently decide:

Who legally inherits the property
What tax position the estate should take
How a contested will should be resolved
Whether an executor has fulfilled their fiduciary duty

Those decisions require executors, settlement specialists, attorneys, CPAs or other licensed professionals.

Alix’s privacy policy explicitly says its software is not itself legal, tax, financial or real-estate advice. Its service brings in professionals and human specialists where those judgments are required.

The cleanest description

Alix is building an AI-assisted operations company for death administration.

The AI:

Reads documents
Finds missing information
Constructs the task plan
Prepares repetitive work
Tracks deadlines and dependencies
Keeps the estate record updated

The humans:

Verify important outputs
Communicate with the family
Make judgment calls
Handle sensitive conversations
Work with banks and agencies
Provide legal and tax expertise
Perform physical-world tasks

So it is closer to an AI-powered family office plus operations team than a normal consumer app.

The customer does not really pay for the AI. They pay for the outcome:

“My parent died. Find everything, handle the bureaucracy, keep us informed and get the estate legally closed.”

Wait, so they replace lawyers then given that they hire lawyers and CPAs

For many normal, uncontested estates, Alix can replace the need for the family to hire and manage a probate lawyer separately.

But Alix itself is not the lawyer. Alix is the company coordinating the entire estate settlement. When legal work is required, it brings in a licensed probate attorney from its network. When tax work is required, it brings in a CPA or tax professional. Alix’s own terms explicitly state that Alix is not a law firm and cannot itself provide legal advice.

The structure is:

Family hires Alix
        ↓
Alix assigns a Settlement Specialist
        ↓
Alix manages the whole estate
        ↓
Network attorney handles legal filings and hearings
CPA handles tax returns
Alix handles the remaining administrative work

For example, the attorney may:

File the probate petition
Respond to the court
Attend required hearings
Give legal advice

Alix handles things the lawyer normally leaves to the executor:

Finding assets
Closing accounts
Contacting creditors
Cancelling bills
Transferring vehicles
Organizing documents
Coordinating the house
Updating beneficiaries

Alix says its flat fee can include a licensed probate attorney for required filings and hearings, along with estate administration and tax preparation.

So the accurate answer is:

Alix does not replace the legal function of a lawyer. It replaces the traditional experience of hiring a probate lawyer as your main estate-settlement provider.

Instead of the lawyer being the central person and leaving most work to you, Alix is the central operator, and lawyers and CPAs are specialists it brings in when necessary.

There are limits. If the estate involves a contested will, litigation, fighting beneficiaries or complicated legal disputes, Alix says additional outside counsel may be required. That work is not necessarily included in the ordinary flat fee.

So, practically:

Simple or ordinary estate: Alix may replace separately hiring a law firm.
Complex legal fight: You still need a lawyer, although Alix may help coordinate one.
Legal authority: The licensed lawyer provides it, not Alix or its AI.