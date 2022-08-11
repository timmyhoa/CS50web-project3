

document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#success').style.display = 'none';
  document.querySelector('#error').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  
  
  //Send it away
  document.querySelector('#compose-form').onsubmit = () => {
    //Get recipients, subjects and body
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      })
    })
    .then(response => {
       if (response.ok){
        let success = document.querySelector('#success');
        success.style.display = 'block';
        console.log('success');
        setTimeout(load_mailbox, 1000, 'sent');
      } else {
        console.log('error');
        response.json()
        .then(body => {
          let message = document.querySelector('#error');
          message.innerHTML = body['error'];
          message.style.display = 'block';
        });
      };
    });
    return false;
  }
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  let mainDisplay = document.querySelector('#emails-view')
  mainDisplay.style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  mainDisplay.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get all the available email in the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(mails => {
    mails.forEach(mail => {

      let line = document.createElement('div');
      line.classList.add('mailLine', 'p-3',);

      //Create div for each part to align them in css. 
      let sender = document.createElement('div');
      sender.innerHTML = `${mail.sender}`;
      sender.classList.add('sender')
      let subject = document.createElement('div');
      subject.innerHTML = `${mail.subject}`
      subject.classList.add('subject')
      let time = document.createElement('div');
      time.innerHTML = `${mail.timestamp}`;
      time.classList.add('time')
      
      //Show email content
      line.onclick = () => {
        viewEmail(mail.id);
      };

      if (mail.read) line.classList.add('read');
      
      line.append(sender, subject, time);
      mainDisplay.append(line);
    });
  });
}

function viewEmail(id) {
  console.log(id);
}