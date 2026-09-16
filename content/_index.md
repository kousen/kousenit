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
      subtitle: 'Seven books on Claude Code, Java, Kotlin, Groovy, Gradle, Mockito, and managing up.'
      text: |-
        I've written seven technical books over the past decade, on topics ranging
        from the Groovy/Java intersection to modern Java functional programming,
        Kotlin, Gradle for Android, Mockito, and a managing-up handbook for
        technical professionals. The newest, *Claude Code: Up and Running*, is in
        Early Release on the O'Reilly Learning Platform.
    design:
      columns: '1'
  - block: markdown
    id: books
    content:
      title: ''
      text: |-
        <div class="not-prose grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-5xl mx-auto">
          <a href="/publications/claude-code-up-and-running/" class="block hover:scale-105 transition-transform duration-200 relative">
            <span class="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">Early Release</span>
            <img src="/publications/claude-code-up-and-running/featured.jpeg" alt="Claude Code: Up and Running" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Claude Code: Up and Running</p>
          </a>
          <a href="/publications/mockito-made-clear/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/mockito-made-clear/featured.jpeg" alt="Mockito Made Clear" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Mockito Made Clear</p>
          </a>
          <a href="/publications/help-your-boss-help-you/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/help-your-boss-help-you/featured.jpeg" alt="Help Your Boss Help You" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Help Your Boss Help You</p>
          </a>
          <a href="/publications/kotlin-cookbook/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/kotlin-cookbook/featured.jpeg" alt="Kotlin Cookbook" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Kotlin Cookbook</p>
          </a>
          <a href="/publications/modern-java-recipes/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/modern-java-recipes/featured.jpeg" alt="Modern Java Recipes" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Modern Java Recipes</p>
          </a>
          <a href="/publications/gradle-recipes-for-android/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/gradle-recipes-for-android/featured.jpeg" alt="Gradle Recipes for Android" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Gradle Recipes for Android</p>
          </a>
          <a href="/publications/making-java-groovy/" class="block hover:scale-105 transition-transform duration-200">
            <img src="/publications/making-java-groovy/featured.jpeg" alt="Making Java Groovy" class="w-full rounded-xl shadow-lg" />
            <p class="mt-3 text-center font-semibold">Making Java Groovy</p>
          </a>
        </div>
        <p class="text-center mt-10 text-base text-gray-600 dark:text-gray-400">For earlier academic publications (from a previous life), see my <a href="https://scholar.google.com/citations?user=nrLQYPkAAAAJ&amp;hl=en" class="underline hover:text-primary-600">Google Scholar profile</a>.</p>
    design:
      columns: '1'
  - block: markdown
    id: projects
    content:
      title: '🛠️ Projects'
      text: |-
        A few apps and open-source tools, with live demos where available.
        {{< projects section="projects" >}}
    design:
      columns: '1'
  - block: markdown
    id: training
    content:
      title: '🧑‍🏫 Training Materials'
      text: |-
        Open-source course materials for AI coding tools.
        {{< projects section="training" >}}
    design:
      columns: '1'
  - block: markdown
    id: education
    content:
      title: '🎓 Education'
      text: |-
        <div class="not-prose grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div class="bg-white/90 dark:bg-gray-800/90 rounded-xl p-5 shadow-md">
            <p class="text-lg font-bold">PhD, Mechanical and Aerospace Engineering</p>
            <p class="text-sm text-gray-500 mt-1">1989</p>
            <p class="text-base text-gray-700 dark:text-gray-300">Princeton University</p>
          </div>
          <div class="bg-white/90 dark:bg-gray-800/90 rounded-xl p-5 shadow-md">
            <p class="text-lg font-bold">MA, Mechanical and Aerospace Engineering</p>
            <p class="text-sm text-gray-500 mt-1">1986</p>
            <p class="text-base text-gray-700 dark:text-gray-300">Princeton University</p>
          </div>
          <div class="bg-white/90 dark:bg-gray-800/90 rounded-xl p-5 shadow-md">
            <p class="text-lg font-bold">MS Computer Science</p>
            <p class="text-sm text-gray-500 mt-1">2000</p>
            <p class="text-base text-gray-700 dark:text-gray-300">Rensselaer Polytechnic Institute</p>
          </div>
          <div class="bg-white/90 dark:bg-gray-800/90 rounded-xl p-5 shadow-md">
            <p class="text-lg font-bold">BS Mechanical Engineering</p>
            <p class="text-sm text-gray-500 mt-1">1984</p>
            <p class="text-base text-gray-700 dark:text-gray-300">Massachusetts Institute of Technology</p>
          </div>
          <div class="bg-white/90 dark:bg-gray-800/90 rounded-xl p-5 shadow-md">
            <p class="text-lg font-bold">BS Mathematics</p>
            <p class="text-sm text-gray-500 mt-1">1984</p>
            <p class="text-base text-gray-700 dark:text-gray-300">Massachusetts Institute of Technology</p>
          </div>
        </div>
    design:
      columns: '1'
  - block: markdown
    id: interests
    content:
      title: '✨ Interests'
      text: |-
        <div class="not-prose flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          <span class="inline-block bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full border border-primary-200/50">Java, Kotlin, Groovy</span>
          <span class="inline-block bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full border border-primary-200/50">Spring &amp; Spring Boot</span>
          <span class="inline-block bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full border border-primary-200/50">Gradle build automation</span>
          <span class="inline-block bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full border border-primary-200/50">Android development</span>
          <span class="inline-block bg-primary-50 dark:bg-gray-800 text-primary-800 dark:text-primary-200 px-4 py-2 rounded-full border border-primary-200/50">AI and Large Language Models</span>
        </div>
    design:
      columns: '1'
  - block: markdown
    id: contact
    content:
      title: '✉️ Contact'
      subtitle: ''
      text: |-
        - **Email:** [ken.kousen@kousenit.com](mailto:ken.kousen@kousenit.com)
        - **Blog:** [Stuff I've Learned Recently](https://kousenit.org)
        - **Newsletter:** [Tales from the jar side (Substack)](https://kenkousen.substack.com)
        - **YouTube:** [Tales from the jar side](https://youtube.com/@talesfromthejarside)
        - **Location:** Marlborough, CT

        🤖 *Agents welcome — click through to the machine-readable [llms.txt](/llms.txt).*
    design:
      columns: '1'
---
