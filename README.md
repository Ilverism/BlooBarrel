
[<img src="https://github.com/user-attachments/assets/419e9ca6-301e-4acd-b17b-6d158d98f44e">](https://bloobarrel.pages.dev/)

## About BlooBarrel
BlooBarrel provides a simpler way for people with a lower technical ability to download assets from GitHub, and for more technical users to share GitHub content with less technical people.

Simply provide the link to a repo, and BlooBarrel will recommend the best asset(s) to download for your platform.

![image](https://github.com/user-attachments/assets/547996b3-f84b-4b1d-b13f-66f617d9aa8c)

---
### Basic Site Usage

1. Paste a GitHub repo URL into the *Search for Releases* search bar.
2. Click the 🔍 search button.
3. Wait a brief moment for any Assets from the latest release to load.
4. View the *Top Recommended Download* or other compatible Assets in the *All Downloads* list.
5. Click the Asset you want to start downloading.

![image](https://github.com/user-attachments/assets/2e274f99-b329-48ab-8c47-e7638138434a)

---

### Other Functionality
- Your *Detected Platform* (used to help recommend Assets) can be changed/overridden using a dropdown menu at the top right.
- You can change how Assets are sorted in the *All Downloads* list by clicking the *Sort By: **Alphabetical*** button.
- After loading a repo, use the *Copy Shareable Link* button to copy a link directly to BlooBarrel, which will load the given repo automatically when opened (e.g., https://bloobarrel.pages.dev/?owner=electron&repo=electron).
- You can also quickly load a repo's content by appending an entire URL to the BlooBarrel page URL when combined with a hash mark (e.g., https://bloobarrel.pages.dev/#https://github.com/electron/electron).
---
### Information Panels
- *Information Panels* can be opened after loading a repo by using a toggle switch that appears at the top right.
- The *Repository Information* panel has the following content:

  - Buttons to open the repo, copy the repo's URL, or open the owner's profile page.
  - The repo's name and 'About' description.
  - A grid of topic badges.
  - A *README* section which first appears as a large glossy button, and can be fully expanded and viewed by clicking on it.
  - The Forks, Watchers, and Stars counts.

- The *Release Information* panel has the following content:

  - Buttons to open the release and copy the release's URL.
  - The release's name, publish date, and creation date.
  - A grid of labels.
  - A *Release Notes* section which first appears as a large glossy button, and can be fully expanded and viewed by clicking on it.
  - The number of Assets in the release.

![image](https://github.com/user-attachments/assets/41217db7-2d34-4c78-bc44-fee9d50bdc9c)

---
### Misc. Features

- Supports ☀️ Light and 🌙 Dark themes (toggle at the top right).
- The BlooBarrel repo can be opened by clicking the logo at the top left.
- Both the small *Instructions* panel and the whole *Search* panel can be hidden.
- You can jump to a platform's section in the *All Downloads* list by clicking the platform's icon on the left side of the list.

![image](https://github.com/user-attachments/assets/95c50481-bd93-4783-a7c0-22f80c5e87eb)

---
### Notes

* Any *Source code* items which normally appear as Assets in GitHub's native release page are not included for download, nor are they counted in the downloadable Assets counter in the *Release Information* panel.
* If no downloadable Assets are available for a repo, a warning message will be displayed instead; the *Information Panels* toggle will still be made available, but only the *Repository Information* panel will be visible.
* This site uses GitHub's REST API to make requests to fetch information about GitHub repositories. If you approach 15 requests per hour, you may get a rate limit warning and an indicator of how many requests you have remaining. Please do not attempt to abuse the API in any capacity. For more information about rate limits for the GitHub REST API, you can check their official documentation here: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28.

---
### Credits
Site by ilverism.

