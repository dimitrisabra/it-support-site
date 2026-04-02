# IT Support Site

## Project Description
The IT Support Site is a web-based platform designed for IT teams to efficiently manage support tickets, provide guidance, and enhance communication between the IT department and its users. This project aims to streamline IT operations, making it easier for users to report issues, track their requests, and find relevant support documentation.

## Features
- **User Authentication**: Secure login for users and IT staff.
- **Ticket Management**: Users can submit and manage their support tickets, while IT can track progress and resolution.
- **Knowledge Base**: A searchable repository of articles and documentation to assist users in resolving common issues independently.
- **Notifications**: Email and in-app notifications for users regarding ticket status updates.
- **User Dashboard**: Personalized dashboard to view ticket history and access resources.

## Setup Instructions
To set up the IT Support Site locally, follow these steps:
1. **Clone the Repository**:  
   ```bash
   git clone https://github.com/dimitrisabra/it-support-site.git
   cd it-support-site
   ```
2. **Install Dependencies**:  
   Make sure you have Node.js installed, then run:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:  
   Create a `.env` file in the root directory and set the following variables:
   ```env
   PORT=3000
   DATABASE_URL=your_database_url
   JWT_SECRET=your_jwt_secret
   ```
4. **Run Migrations**:  
   ```bash
   npm run migrate
   ```
5. **Start the Application**:  
   ```bash
   npm start
   ```
6. **Access the Application**:  
   Open your browser and go to `http://localhost:3000`.

## Tech Stack
- **Frontend**: React
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JSON Web Tokens (JWT)
- **Styling**: CSS, Bootstrap

## Usage Guide
- **Creating a Ticket**: After logging in, navigate to the "Create Ticket" page and fill out the form to report an issue.
- **Viewing Tickets**: Access your dashboard to view your submitted tickets and their statuses.
- **Searching Knowledge Base**: Use the search bar on the knowledge base page to find articles related to your issue.
- **Updating Profile**: Users can update their profile information through the "Profile" section.

## Contribution Guidelines
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/YourFeature`)
3. Make your changes and commit them (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Last Updated: 2026-04-02*