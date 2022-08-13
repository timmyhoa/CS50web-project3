//Handle the back button
window.onpopstate = event => {
  app = event.state.app
  if (app === 'view') viewEmail(event.state.id);
  else if (app === 'compose') compose_email(event.state.recipients, event.state.subject, event.state.body);
  else load_mailbox(event.state.app);
}

document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views and add to history
  document.querySelector('#inbox').addEventListener('click', () => {
    let mailbox = 'inbox';
    history.pushState({app: mailbox}, '', `/${mailbox}`);
    load_mailbox(mailbox);
  });
  document.querySelector('#sent').addEventListener('click', () => {
    let mailbox = 'sent';
    history.pushState({app: mailbox}, '', `/${mailbox}`);
    load_mailbox(mailbox);
  });
  document.querySelector('#archived').addEventListener('click', () => {
    let mailbox = 'archive';
    history.pushState({app: mailbox}, '', `/${mailbox}`);
    load_mailbox(mailbox);
  });
  document.querySelector('#compose').addEventListener('click', () => {
    history.pushState({app: 'compose',}, '', `/compose`);
    compose_email();
  });
  // By default, load the inbox and set the first history to be inbox
  load_mailbox('inbox');
  history.replaceState({app: 'inbox'}, '', '/inbox');
});

function clearView() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#viewEmail').style.display = 'none';
}

function compose_email(recipients = '', subject = '', body = '') {

  // Show compose view and hide other views
  clearView();
  document.querySelector('#success').style.display = 'none';
  document.querySelector('#error').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
  
  if (body) {
    document.querySelector('#compose-body').focus();
    document.querySelector('#compose-body').setSelectionRange(0, 0);
  };

  //Send it away
  document.querySelector('#compose-form').onsubmit = () => {
    //Get recipients, subjects and body
    recipients = document.querySelector('#compose-recipients').value;
    subject = document.querySelector('#compose-subject').value;
    body = document.querySelector('#compose-body').value;

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
  currentMailbox = mailbox;
  clearView();
  let mainDisplay = document.querySelector('#emails-view');
  mainDisplay.style.display = 'block';

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
        id = mail.id
        history.pushState({app: 'view', id: id}, '', `/emails/${id}`);
        viewEmail(id);
      };

      if (mail.read) line.classList.add('read');
      
      line.append(sender, subject, time);
      mainDisplay.append(line);
    });
  });
}

function viewEmail(id) {
  clearView();


  let viewPort = document.querySelector('#viewEmail');


  fetch(`/emails/${id}`).then(response => response.json())
  .then(data => {
    //Fill in the content of the email to html
    document.querySelector('#viewEmailSender').innerHTML = data.sender;
    document.querySelector('#viewEmailRecipients').innerHTML = data.recipients;
    document.querySelector('#viewEmailSubject').innerHTML = data.subject;
    document.querySelector('#viewEmailBody').innerHTML = data.body;
    document.querySelector('#viewEmailTime').innerHTML = data.timestamp;
    
    //Handle the reply button
    let replyBtn = document.querySelector('#replyBtn');

    replyBtn.onclick = () => {
      recipients = data.sender;
      subject = data.subject.slice(0,3) === 'RE:' ? data.subject : `RE: ${data.subject}`;

      //Js doesn't ignore indentation in literal template :(
      body = `\n_____________________________________________\nOn ${data.timestamp} ${data.sender} wrote:\n${data.body}`;
      compose_email(recipients, subject, body);
      history.pushState({app: 'compose', recipients: recipients, subject: subject, body: body}, '', '/compose')
    }

    //Handle the archive button
    let archiveBtn = document.querySelector('#archiveBtn');
    
    if (history.state.app === 'sent'){
      archiveBtn.style.display = 'none';
    } else {
      let archived = data.archived; 
  
      function changeArchiveBtn() {
        if (archived){
          archiveBtn.innerHTML = 'Unarchive';
        } else {
          archiveBtn.innerHTML = 'Archive';
        };
        archived = !archived;
      }
  
      changeArchiveBtn();

      archiveBtn.style.display = 'block';

      archiveBtn.onclick = async () => {
        await fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: archived,
          })
        });  

        //Uncomment bellow to change the state of the button after hitting the button
        // changeBtn();

        //Load mailbox and add to history
        load_mailbox('inbox');
        history.pushState({app: 'inbox'}, '', '/inbox');
      };
    }

    
  });
   
  viewPort.style.display = 'block';

  //Update the email to be read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    })
  });
}
