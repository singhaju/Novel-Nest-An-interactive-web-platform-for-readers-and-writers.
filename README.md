# Novel Nest

**Novel Nest** is an interactive web platform designed for reading, writing, and sharing novels online. It serves as a digital library and creative hub where users can discover stories across genres, support their favorite authors, and build a personal reading journey. Writers can publish their work, and engage with readers (Mainly focus on data base project)

This project is developed for the CSS326 course.

## Group Members

- **Singha Junchan** - 6622770350 : Project Manager (PM), Product Owner (PO) and Full stack developer
- **Chanon Sipiyarak** - 6622770319 : Front-end Developer (UI/UX)
- **Kanade Areepoonsiri** - 6622770442: Backend Developer 
- **Johnny Shakespeare Ramseyer** - 6622772448 : Backend Developer (Database)

## Key Features

Novel Nest is designed with a role-based architecture to cater to the specific needs of each user group.

### For Readers:
- **Discover Novels:** Browse a vast library of serialized novels across different genres and tags.
- **Personalized Experience:** Get novel recommendations, create a personal wishlist, and follow favorite authors.
- **Engage with the Community:** Leave reviews, comment on episodes, and interact with other readers.
- **Seamless Reading:** Enjoy a customizable reading interface and keep track of your reading progress.

### For Writers:
- **Publish & Manage Content:** An intuitive dashboard to create, publish, and manage novels and episodes.
- **Track Your Performance:** Monitor key metrics like total views, and reader engagement.
- **Interact with Readers:** View and respond to comments on your stories.

### For Admins:
- **Platform Oversight:** A comprehensive dashboard to monitor site-wide statistics, including active users.
- **User Management:** Verify new writers, manage user roles, and suspend accounts if necessary.
- **Content Moderation:** Review and approve/reject novels and reported comments to ensure a safe environment.

### For Developers:
- **System Maintenance:** A restricted-access page to monitor server health, check security logs, and manage core system features.

## User Interface Preview

| Main Page | Login Page |
| :---: | :---: |
| ![Main Page](https://i.imgur.com/uR3A8wH.png) | ![Login Page](https://i.imgur.com/gK9t7pB.png) |

| Novel Cover | Novel Content |
| :---: | :---: |
| ![Novel Cover](https://i.imgur.com/rN9k4aO.png) | ![Novel Content](https://i.imgur.com/xV3l0Bf.png) |

## Database Design

The platform is built on a robust MySQL database designed to handle the complex relationships between users, novels, episodes, and their interactions.

### ER Diagram
![ER Diagram](https://i.imgur.com/vHqY7bY.png)

### Key Database Tables:
- **Users:** Stores information for all registered accounts (Readers, Writers, Admins, Developers).
- **Novels:** Contains all the core information about each novel.
- **Episodes:** Stores the content for each individual chapter or episode of a novel.
- **Reviews & Comments:** Manages user-submitted ratings and comments.
- **Bridge Tables:** Manages the many-to-many relationships such as `Novel_Authors`, `User_Wishlist`, and `User_Follows`.

The database also utilizes **triggers** for actions like automatically recalculating a novel's average rating and **stored procedures** for functionalities like fetching trending novels.

## Project Timeline

| Week | Date | Plan |
| :--- | :--- | :--- |
| **Week 8** | Oct 7 | Project Proposal Submission |
| **Week 9** | Oct 14 | Backend Foundation & Setup |
| **Week 10** | Oct 21 | Core Content API Development |
| **Week 11** | Oct 28 | Front-end Development (Reader View) |
| **Week 12** | Nov 4 | Reader Interaction Features |
| **Week 13** | Nov 11 | Writer & Admin Dashboards |
| **Week 14** | Nov 18 | Final Testing & Presentation Prep |
| **Week 15** | Nov 25 | Project Submission & Presentation |
| **Week 16** | Dec 2 | No Lab (Final Exam) |

---
