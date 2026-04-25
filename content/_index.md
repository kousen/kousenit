---
title: ''
summary: ''
date: 2026-04-25
type: landing

sections:
  - block: resume-biography-3
    content:
      username: me
      text: ''
      button:
        text: Email Me
        url: mailto:ken.kousen@kousenit.com
      headings:
        about: ''
        education: ''
        interests: ''
    design:
      background:
        gradient_mesh:
          enable: true
      name:
        size: lg
      avatar:
        size: medium
        shape: circle
  - block: markdown
    content:
      title: '📚 Books'
      subtitle: 'Six books on Java, Kotlin, Groovy, Gradle, Mockito, and managing up.'
      text: |-
        I've written six technical books over the past decade, on topics ranging
        from the Groovy/Java intersection to modern Java functional programming,
        Kotlin, Gradle for Android, Mockito, and a managing-up handbook for
        technical professionals.
    design:
      columns: '1'
  - block: collection
    id: books
    content:
      title: ''
      filters:
        folders:
          - publications
        exclude_featured: false
    design:
      view: article-grid
      columns: 3
  - block: markdown
    content:
      title: '✉️ Contact'
      subtitle: ''
      text: |-
        - **Email:** [ken.kousen@kousenit.com](mailto:ken.kousen@kousenit.com)
        - **Phone:** +1 (860) 882-4279
        - **Blog:** [Stuff I've Learned Recently](https://kousenit.org)
        - **Newsletter:** [Tales from the jar side](https://kenkousen.substack.com)
        - **Business address:** Kousen IT, Inc., 11 Emily Road, Marlborough, CT 06447
    design:
      columns: '1'
---
