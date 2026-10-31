# The King's Stronghold

A responsive, unofficial Los Angeles Kings fan dashboard for GitHub Pages.

## Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, and `app.js` to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
4. Open the published Pages URL.

No build step or API key is required.

## Live data

The dashboard requests public NHL web endpoints from the browser:
- Current score: `/v1/score/now`
- Club schedule: `/v1/club-schedule-season/LAK/20262027`
- Standings: `/v1/standings/now`
- Current roster: `/v1/roster/LAK/current`
- Club stats: `/v1/club-stats/LAK/now`

The app refreshes every five minutes. NHL endpoints are public but not a guaranteed stable third-party API; availability, CORS behavior, and response fields can change. The site displays a status message if data cannot be fetched.

## Coverage notes

- Live scores, schedule, standings, roster and some team statistics are connected where the NHL endpoints return them.
- Complete injury reports, reliable trade-rumour feeds, official transaction history, detailed contract/cap sheets, and regional broadcast availability are not consistently available from these public endpoints. These sections deliberately avoid fabricating values and link to official or relevant sources.
- The website is an unofficial fan project and is not affiliated with or endorsed by the NHL or Los Angeles Kings.
