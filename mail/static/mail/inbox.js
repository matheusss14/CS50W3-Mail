document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function hide_all() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-list').innerHTML = "";
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-info-view').innerHTML = '';
  document.querySelector('#email-info-view').style.display = 'none';
}

function compose_email() {

  // Show compose view and hide other views
  hide_all();
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const body = document.querySelector('#compose-body').value;

    if ( !recipients || !subject || !body ) {
      alert("Missing fields")
    } else {
      console.log(recipients, subject, body)

      fetch('/emails', {
          method: 'POST',
          body: JSON.stringify({
              recipients: recipients,
              subject: subject,
              body: body
         })
         })
        .then(response => response.json())
        .then(result => {
            // Print result
           console.log(result);
           if (result.message == "Email sent successfully.") {
            document.querySelector('#emails-view').style.display = 'block';
            document.querySelector('#compose-view').style.display = 'none';
           } else {
            alert("Something went wrong, try again")
           }
        });
    }
    return false
  };
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  hide_all();
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#page-title').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      //... do something else with emails ...
      emails.forEach(display_email);

      load_email();
  });
}

function display_email(email) {
  console.log(email)
  const post = document.createElement("tr");
  post.id = email.id;
  post.className = "email"
  if (email.read) {
    post.style.background = "#cfcfcf";
  } else {
    post.style.background = "#fdfdfd";
  }
  post.innerHTML = `
      <td style="width: 20%; max-width: 218px; text-align: center; font-weight: 600; font-size: 1.1rem">${email.sender}</td>
      <td style="width: 20%; max-width: 207px; font-weight: 600; font-size: 1.3rem">${email.subject}</td>
      <td style="width: 50%; max-width: 510px">${email.body}</td>
      <td style="width: 10%; text-align: center; padding-right: 20px">${email.timestamp}</td>
  `;

  document.querySelector('#emails-list').append(post)
}

function load_email() {
  document.querySelectorAll('.email').forEach((email) => {
    email.onclick = () => {
      console.log(email.id)

      hide_all()
      document.querySelector('#email-info-view').style.display = 'block';

      fetch(`/emails/${email.id}`)
      .then(response => response.json())
      .then(info => {
      // Print email
       console.log(info);

      // ... do something else with email ...
      const post = document.createElement('div');
      const headings = document.createElement('div');
      const fromto = document.createElement('div');
      const body = document.createElement('div');
      const buttons = document.createElement('div');

      headings.innerHTML = `
          <h1>${info.subject}</h1>
      `
      post.append(headings)

      fromto.className = "email-head"
      fromto.innerHTML = `
        <div>
          <p>from: ${info.sender}</p>
        </div>
        <div>
          <p>${info.timestamp}</p>
        </div>
      `
      post.append(fromto)

      body.innerHTML = `
        <p>${info.body}</p>
      `
      post.append(body)

      const user = document.querySelector('#user').innerHTML;
      if (info.sender == user) {
        buttons.remove()
      } else {
        if (!info.archived) {
          buttons.innerHTML = `
          <button id="reply" onclick=reply(${info.id})>Reply</button>
          <button id="archive" onclick=archive(${info.id})>Archive</button>
        `
        } else {
          buttons.innerHTML = `
          <button id="reply" onclick=reply(${info.id})>Reply</button>
          <button id="archive" onclick=archive(${info.id})>
            Unarchive
            </button>
        `
        }
      }


      post.append(buttons)

      document.querySelector('#email-info-view').append(post)

      // UPDATE email (SET IT AS READ/ARCHIVED)
      fetch(`/emails/${info.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
        })
      })
      });
    }
  })
}

function archive(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(info => {
  // Print email
    if (info.archived) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
          })
        })
        hide_all();
        setTimeout(function() {
          load_mailbox('inbox');
        }, 100)
    } else {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
          })
        })
        hide_all();
        setTimeout(function(){
          //do what you need here
          load_mailbox('archive');
        }, 100);
    }
  });
};

function reply(id) {
  hide_all()
  document.querySelector('#compose-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(info => {
    console.log(info)
    document.querySelector('#compose-recipients').value = `${info.sender}`;
    document.querySelector('#compose-subject').value = `RE: ${info.subject}`;
    document.querySelector('#compose-body').value = `On ${info.timestamp}, ${info.sender} wrote: ${info.body}`;
  
    document.querySelector('#compose-form').onsubmit = () => {
      const recipients = document.querySelector('#compose-recipients').value;
      const subject = document.querySelector('#compose-subject').value;
      const body = document.querySelector('#compose-body').value;
  
      if ( !recipients || !subject || !body ) {
        alert("Missing fields")
      } else {
        console.log(recipients, subject, body)
  
        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
           })
           })
          .then(response => response.json())
          .then(result => {
              // Print result
             console.log(result);
             if (result.message == "Email sent successfully.") {
              document.querySelector('#emails-view').style.display = 'block';
              document.querySelector('#compose-view').style.display = 'none';
             } else {
              alert("Something went wrong, try again")
             }
          });
      }
      return false
    };
  });
}

// GET SET of emails (inbox, sent, archived)
//fetch('/emails/inbox')
//.then(response => response.json())
//.then(emails => {
    // Print emails
//    console.log(emails);

    // ... do something else with emails ...
//});


// SPECIFIC EMAIL (by id)
  // fetch('/emails/100')
  // .then(response => response.json())
  // .then(email => {
      // Print email
      // console.log(email);

      // ... do something else with email ...
  // });

// POST email (submit)
// fetch('/emails', {
//  method: 'POST',
//  body: JSON.stringify({
//      recipients: 'baz@example.com',
//      subject: 'Meeting time',
//      body: 'How about we meet tomorrow at 3pm?'
// })
// })
//.then(response => response.json())
//.then(result => {
//    // Print result
//   console.log(result);
//});

// UPDATE email (SET IT AS READ/ARCHIVED)
//fetch('/emails/100', {
//  method: 'PUT',
//  body: JSON.stringify({
//      archived: true
//  })
//})