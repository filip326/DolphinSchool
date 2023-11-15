const domain = useRuntimeConfig().public.DOMAIN;

function surroundHtml(content: string, unsubscribeLink: string) {
    return `<!DOCTYPE html>
<html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">
    </head>
    <body>
        <header>
            <img src="https://${domain}/img/School/DolhinSchool_light.png" alt="DolphinSchool Logo" />
        </header>

        <main>
            ${content}
        </main>

        <footer>
            <p>
                Du möchtest keine weiteren E-Mails von uns erhalten? <a href="https://${domain}/ubsubscribe-mail?code=${unsubscribeLink}">Hier abmelden</a>.
            </p>
            <p>
                Diese E-Mail wurde automatisch generiert. 
            </p>
        </footer>
    </body>

    <style>

        * {
            margin: 0;
            padding: 0;
            font-family: sans-serif;
        }

        header {
            background-color: #1a1a1a;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 50px;
        }

        header img {
            height: 30px;
            width: auto;
        }


    </style>
</html>
`;
}

function surroundText(content: string, unsubscribeLink: string) {
    return `${content}
---
DolphinSchool
Diese E-Mail wurde automatisch generiert. Du möchtest keine weiteren E-Mails von uns erhalten? Hier abmelden: https://${domain}/ubsubscribe-mail?code=${unsubscribeLink}
`;
}

export { surroundHtml, surroundText };
