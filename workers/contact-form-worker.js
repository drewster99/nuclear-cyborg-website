export default {
  async email(message, env) {
    // Using Cloudflare's Email Workers
    const email = {
      from: {
        email: "contact-form@yourdomain.com",
        name: "Contact Form"
      },
      to: [
        {
          email: env.DESTINATION_EMAIL, // Set this in your Worker environment variables
          name: env.DESTINATION_NAME
        }
      ],
      subject: "New Contact Form Submission",
      content: [{
        type: "text/plain",
        value: `Name: ${message.name}\nEmail: ${message.email}\n\nMessage:\n${message.message}`
      }]
    };

    try {
      await env.EMAIL.send(email);
      return true;
    } catch (err) {
      console.error('Failed to send email:', err);
      return false;
    }
  },

  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const body = await request.json();
      
      // Basic validation
      if (!body.name || !body.email || !body.message) {
        return new Response("Missing required fields", { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return new Response("Invalid email format", { 
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }

      // Send email
      const success = await this.email(body, env);
      
      if (success) {
        return new Response(JSON.stringify({ message: "Email sent successfully" }), { 
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (err) {
      console.error('Error:', err);
      return new Response(JSON.stringify({ error: "Failed to process request" }), { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        }
      });
    }
  }
}; 