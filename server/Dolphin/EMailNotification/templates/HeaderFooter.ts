const domain = useRuntimeConfig().public.DOMAIN;

function surround(content: string, unsubscribeLink: string) {
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

export default surround;
