/* Quiz content only. No DOM code lives here.
   Loaded before app.js, exposes two globals:
     QUIZ_LEVELS  difficulty settings (name + seconds allowed per question)
     QUIZ_DATA    array of quizzes, each with questions per level
   A question is { text, options: [4 strings], answerIndex, explanation }
   where answerIndex is the 0-based position of the correct option. */

window.QUIZ_LEVELS = {
  beginner:     { label: 'Beginner',     secondsPerQuestion: 45 },
  intermediate: { label: 'Intermediate', secondsPerQuestion: 60 }
};

(function () {
  'use strict';

  // Small helper so each question stays on a few readable lines.
  function q(text, options, answerIndex, explanation) {
    return { text: text, options: options, answerIndex: answerIndex, explanation: explanation };
  }

  window.QUIZ_DATA = [
    {
      id: 'html-structure',
      title: 'HTML Structure & Semantics',
      category: 'HTML',
      featured: true,
      summary: 'The document skeleton, landmark elements and the tags that give a page meaning beyond how it looks.',
      levels: {
        beginner: [
          q('Which element is meant for a page’s main block of navigation links?',
            ['<nav>', '<menu>', '<links>', '<header>'], 0,
            '<nav> is a landmark that tells assistive technology "this is major navigation". <header> is for introductory content and may contain a nav, but it is not the nav itself.'),
          q('What does the lang attribute on the <html> element do?',
            ['Sets a colour theme for the page', 'Declares the language of the document', 'Downloads a translation file', 'Forces text to run right-to-left'], 1,
            'lang (for example lang="en") lets screen readers choose the right pronunciation and lets browsers offer correct translation and spell-check.'),
          q('Which heading element has the highest rank?',
            ['<head>', '<h6>', '<h1>', '<title>'], 2,
            '<h1> is the top-level heading and <h6> the lowest. <head> and <title> are document metadata, not headings.'),
          q('Which attribute supplies a text alternative for an image?',
            ['title', 'caption', 'alt', 'label'], 2,
            'alt text is read by screen readers and shown if the image fails to load. title only adds an optional tooltip.'),
          q('Which markup creates a link to another page?',
            ['<a src="page.html">Next</a>', '<link>page.html</link>', '<a href="page.html">Next</a>', '<url="page.html">Next</url>'], 2,
            'Anchors use the href attribute for their destination. src belongs to elements that embed content, such as <img>.')
        ],
        intermediate: [
          q('When is <section> a better choice than <div>?',
            ['When you only need a styling hook', 'When the content is a thematic group that would normally have a heading', 'Whenever you use Flexbox', 'When the content is shorter than a paragraph'], 1,
            '<section> carries meaning: a thematic grouping, usually labelled by a heading. <div> has no meaning and is the right tool when you only need a wrapper for layout or styling.'),
          q('Which element is intended for self-contained content that makes sense on its own, such as a blog post?',
            ['<section>', '<article>', '<aside>', '<figure>'], 1,
            '<article> is for content that could be distributed or reused independently, like a post, a comment or a news item.'),
          q('What does the defer attribute do on <script src="app.js" defer>?',
            ['Runs the script before the HTML is parsed', 'Downloads it in parallel and runs it after the document has been parsed', 'Runs it only when the user clicks something', 'Blocks rendering until it has loaded'], 1,
            'A deferred script downloads while parsing continues and executes after parsing finishes, in the order the scripts appear. That means the DOM exists when your code runs.'),
          q('What is the purpose of <!DOCTYPE html>?',
            ['It loads the HTML5 standard library', 'It tells the browser to use standards mode instead of quirks mode', 'It validates the page on the server', 'It sets the character encoding'], 1,
            'Without a doctype, browsers fall back to quirks mode and emulate old, inconsistent layout behaviour. Character encoding is set separately with <meta charset>.'),
          q('Which structure correctly pairs an image with a caption?',
            ['<img caption="Sunset" src="a.jpg">', '<figure><img src="a.jpg" alt="Sunset"><figcaption>Sunset over the bay</figcaption></figure>', '<img src="a.jpg"><caption>Sunset</caption>', '<div class="img"><label>Sunset</label></div>'], 1,
            '<figure> groups self-contained media and <figcaption> labels it. <caption> is only valid inside a <table>, and img has no caption attribute.')
        ]
      }
    },
    {
      id: 'html-forms',
      title: 'Forms & Accessibility',
      category: 'HTML',
      featured: false,
      summary: 'Labels, input types, validation attributes and the markup that keeps forms usable for everyone.',
      levels: {
        beginner: [
          q('Which element lets a user click its text to focus the related input?',
            ['<label>', '<legend>', '<caption>', '<output>'], 0,
            'A <label> associated with a control enlarges the click target and is announced by screen readers when the field gets focus.'),
          q('Which input type hides what the user types?',
            ['type="hidden"', 'type="secret"', 'type="password"', 'type="mask"'], 2,
            'type="password" shows dots instead of characters. type="hidden" is invisible and not editable at all.'),
          q('Which attribute stops a form being submitted while a field is empty?',
            ['mandatory', 'required', 'notempty', 'validate'], 1,
            'required is the built-in constraint attribute. The browser blocks submission and shows a message for the first invalid field.'),
          q('Which pair of elements groups related controls, such as a set of radio buttons, under a caption?',
            ['<div> and <title>', '<group> and <caption>', '<fieldset> and <legend>', '<section> and <label>'], 2,
            '<fieldset> groups controls and <legend> names the group, which screen readers announce before each control inside it.'),
          q('Which <form> attribute sets where the data is sent?',
            ['target', 'method', 'src', 'action'], 3,
            'action holds the URL that receives the submission. method chooses GET or POST.')
        ],
        intermediate: [
          q('How do you link a label to an input without nesting one inside the other?',
            ['Give the label for="x" and the input id="x"', 'Give both the same class', 'Put them next to each other in the markup', 'Give the label name="x"'], 0,
            'The for attribute of the label must match the id of the control. Adjacent placement alone creates no programmatic link.'),
          q('What does type="email" provide?',
            ['Confirmation that the address really exists', 'Basic format checking and a suitable mobile keyboard', 'Automatic sending of an email', 'Encryption of the value'], 1,
            'The browser checks the value looks like an address and mobile devices show an @ keyboard. It cannot know whether the mailbox exists.'),
          q('What does novalidate on a <form> do?',
            ['Skips server-side checks', 'Turns off the browser’s built-in validation on submit', 'Makes every field optional on the server', 'Prevents the form from submitting'], 1,
            'novalidate disables the browser’s constraint validation so your own JavaScript can handle it. The form still submits.'),
          q('What must radio buttons share so that only one in the set can be selected?',
            ['The same id', 'The same value', 'The same name', 'The same class'], 2,
            'Radio buttons are grouped by an identical name attribute. Each should keep its own distinct value.'),
          q('Why should placeholder text not replace a label?',
            ['Placeholders cannot be styled', 'It vanishes once the user types and is often low contrast and not reliably announced', 'Placeholders only work on password fields', 'It makes the form slower'], 1,
            'A placeholder is a hint, not a name. Once the field has content the hint disappears, leaving users with no reminder of what the field is for.')
        ]
      }
    },
    {
      id: 'css-layout',
      title: 'CSS Layout',
      category: 'CSS',
      featured: true,
      summary: 'The box model, Flexbox, Grid and positioning: how elements end up exactly where they do.',
      levels: {
        beginner: [
          q('From the inside out, which is the correct order of the CSS box model?',
            ['Content, padding, border, margin', 'Content, margin, border, padding', 'Padding, content, border, margin', 'Content, border, padding, margin'], 0,
            'Content sits in the middle, padding surrounds it, then the border, and margin is the outer space between this box and others.'),
          q('Which declaration turns an element into a flex container?',
            ['flex: container', 'display: flex', 'position: flex', 'layout: flex'], 1,
            'display: flex makes the element a flex container and its direct children flex items.'),
          q('In a default flex row, which property aligns items along the main (horizontal) axis?',
            ['align-items', 'justify-content', 'flex-wrap', 'order'], 1,
            'justify-content works along the main axis; align-items works along the cross axis.'),
          q('A child has position: absolute. What is it positioned relative to?',
            ['The browser window, always', 'Its parent, always', 'Its nearest positioned ancestor, or the page if none exists', 'The previous sibling'], 2,
            'An absolutely positioned element uses the closest ancestor whose position is not static. Giving the parent position: relative is the usual way to set that anchor.'),
          q('Which unit is relative to the width of the viewport?',
            ['em', 'rem', 'vw', 'px'], 2,
            '1vw equals 1% of the viewport width. em and rem depend on font size, and px is an absolute CSS pixel.')
        ],
        intermediate: [
          q('What does box-sizing: border-box change?',
            ['Adds a border to the element', 'Makes width and height include padding and border', 'Removes the margin', 'Makes the element a block'], 1,
            'With border-box, a 300px-wide element stays 300px wide even after you add padding and a border. With the default content-box those would be added on top.'),
          q('What does grid-template-columns: repeat(3, 1fr) create?',
            ['Three columns of 1 pixel each', 'Three equal-width columns sharing the available space', 'One column repeated three times vertically', 'Three rows of equal height'], 1,
            '1fr is one fraction of the free space, so three 1fr tracks divide the container into equal columns.'),
          q('In a flex container with the default direction, what does align-items control?',
            ['Spacing along the main axis', 'Alignment along the cross axis', 'The order of items', 'Whether items wrap'], 1,
            'The default direction is row, so the main axis is horizontal and align-items positions items vertically along the cross axis.'),
          q('Which statement about margin collapsing is correct?',
            ['Horizontal margins of siblings always collapse', 'Vertical margins of adjacent block siblings can collapse into the larger one', 'Margins collapse between flex items', 'Padding collapses as well'], 1,
            'Adjacent vertical margins in normal block flow merge to the larger value. Flex and grid items do not collapse margins.'),
          q('Which media query applies only when the viewport is 600px wide or narrower?',
            ['@media (min-width: 600px)', '@media (max-width: 600px)', '@media (width > 600)', '@media screen and (600px)'], 1,
            'max-width means "up to this width". min-width is the opposite and is the basis of mobile-first design.')
        ]
      }
    },
    {
      id: 'js-core',
      title: 'JavaScript Core',
      category: 'JavaScript',
      featured: true,
      summary: 'Variables, types, equality and array methods: the language fundamentals every later topic leans on.',
      levels: {
        beginner: [
          q('Which keyword declares a block-scoped variable that can be reassigned?',
            ['var', 'let', 'const', 'static'], 1,
            'let is block-scoped and reassignable. const is block-scoped but cannot be reassigned, and var is function-scoped.'),
          q('What does typeof "42" return?',
            ['"number"', '"string"', '"undefined"', '"object"'], 1,
            'The quotes make it a string even though it looks like a number.'),
          q('What does 2 + "2" evaluate to?',
            ['4', '"4"', '"22"', 'NaN'], 2,
            'When one operand of + is a string, JavaScript concatenates instead of adding, so the number 2 becomes "2" and the result is "22".'),
          q('Which array method adds an element to the end?',
            ['push()', 'pop()', 'shift()', 'unshift()'], 0,
            'push adds to the end, pop removes from the end, shift removes from the start, unshift adds to the start.'),
          q('Which operator compares both value and type?',
            ['=', '==', '===', '=>'], 2,
            '=== is strict equality with no type conversion. == converts types first, which can give surprising results.')
        ],
        intermediate: [
          q('What is the key difference between Array.prototype.map and forEach?',
            ['map is faster on every engine', 'map returns a new array of the callback results; forEach returns undefined', 'forEach can break out early', 'map changes the original array'], 1,
            'Use map to transform data into a new array. Use forEach when you only want a side effect such as logging or updating the DOM.'),
          q('Given const list = [1, 2, 3]; is list.push(4) allowed?',
            ['No, const arrays are frozen', 'Yes, const prevents reassigning the variable, not changing the array', 'Only inside a function', 'Only with strict mode'], 1,
            'const binds the name to the array permanently, but the array itself is still mutable. list = [] would throw.'),
          q('What happens when JSON.parse receives invalid JSON?',
            ['It returns null', 'It returns an empty object', 'It throws a SyntaxError', 'It returns undefined'], 2,
            'JSON.parse throws, so reading data from storage or a network should be wrapped in try/catch.'),
          q('What does [1, 2, 3].filter(n => n > 1) return?',
            ['[1]', '[2, 3]', '[true, true, false]', '3'], 1,
            'filter keeps the elements for which the callback returns true: 2 and 3.'),
          q('Which expression evaluates to true?',
            ['0 === false', '"5" === 5', 'null == undefined', 'NaN == NaN'], 2,
            'null == undefined is true by a special rule of loose equality. The others are false, and NaN is not equal to anything, including itself.')
        ]
      }
    },
    {
      id: 'js-dom',
      title: 'DOM & Events',
      category: 'JavaScript',
      featured: false,
      summary: 'Selecting elements, handling events and updating the page without opening security holes.',
      levels: {
        beginner: [
          q('Which method returns the first element matching a CSS selector?',
            ['document.querySelector()', 'document.getElement()', 'document.find()', 'document.select()'], 0,
            'querySelector accepts any CSS selector and returns the first match, or null. querySelectorAll returns all matches.'),
          q('Which method attaches a click handler to an element?',
            ['element.onClickAdd()', 'element.addEventListener("click", fn)', 'element.listen("click", fn)', 'element.bind("click", fn)'], 1,
            'addEventListener registers a handler without replacing others for the same event.'),
          q('Which property sets an element’s text without parsing it as HTML?',
            ['innerHTML', 'textContent', 'outerHTML', 'value'], 1,
            'textContent treats the string as plain text, so characters like < are shown, not interpreted as tags.'),
          q('Which call creates a new element in memory?',
            ['document.createElement("div")', 'document.newElement("div")', 'document.write("div")', 'document.append("div")'], 0,
            'createElement makes the element but does not show it until you insert it with append or appendChild.'),
          q('What kind of values does localStorage store?',
            ['Any JavaScript value', 'Only numbers', 'Strings, which persist after the browser is closed', 'Strings that are cleared when the tab closes'], 2,
            'localStorage stores strings only and keeps them until cleared. sessionStorage is the one that ends with the tab.')
        ],
        intermediate: [
          q('What is event delegation?',
            ['Giving each child its own listener', 'Attaching one listener to a parent and using event.target to find which child was hit', 'Cancelling an event before it fires', 'Running handlers in a worker'], 1,
            'Events bubble up, so one listener on a container can handle every child, including ones added later.'),
          q('Why is textContent safer than innerHTML for text that came from a user?',
            ['It runs faster', 'innerHTML parses markup, so injected tags or scripts could run', 'textContent encrypts the text', 'innerHTML cannot hold long text'], 1,
            'Inserting unescaped user input with innerHTML can allow cross-site scripting. textContent never creates elements from the string.'),
          q('What does event.preventDefault() do in a form’s submit handler?',
            ['Stops the event bubbling to parents', 'Stops the browser’s default action, such as reloading the page', 'Deletes the form', 'Removes all other listeners'], 1,
            'preventDefault cancels the default behaviour. Stopping bubbling is the separate stopPropagation.'),
          q('You start a timer with const id = setInterval(tick, 1000). How do you stop it?',
            ['clearInterval(id)', 'stopInterval(id)', 'id.stop()', 'setInterval(null)'], 0,
            'Keep the id and pass it to clearInterval. A forgotten interval keeps running, which is how timer leaks happen.'),
          q('After localStorage.setItem("n", 5), what is typeof localStorage.getItem("n")?',
            ['"number"', '"string"', '"object"', '"undefined"'], 1,
            'Values are converted to strings on the way in, so you must convert back with Number() or JSON.parse.')
        ]
      }
    }
  ];
})();
