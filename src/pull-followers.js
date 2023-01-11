// https://www.quora.com/profile/Gary-Meaney/followers

qs = ['Name,Description,Link,Followers'];
[].forEach.call(document.querySelectorAll('.qu-tapHighlight--none'), function(q) {
    const qLink = q.querySelector('a');
    if (qLink) {
      const link = qLink.attributes.href.value;
      const nameEl = q.querySelector('span span.q-text.qu-bold');
      const name = nameEl ? nameEl.textContent.replace(/"/g, "'") : '';
      const descriptionEl = q.querySelector('span.qu-dynamicFontSize--small');
      const description = descriptionEl ? descriptionEl.textContent.replace(/"/g, "'") : '';
      const personHtml = q.innerHTML;
      const followersMatch = personHtml.match(/([0-9.K]*) followers/);
      let followers = followersMatch ? followersMatch[1] : '0';
      if (/K$/.test(followers)) {
          followers = parseFloat(followers.replace(/K/, '')) * 1000;
      } 
      qs.push(`"${name}","${description}",${link},${followers}`);
    }
});
console.log(qs.join('\n'));
