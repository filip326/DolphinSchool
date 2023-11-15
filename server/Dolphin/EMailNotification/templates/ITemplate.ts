interface ITemplate {
    userFullName: string;
    unsubscribeCode: string;

    toHtml(): string;
    toText(): string;

    get subject(): string;
}

export default ITemplate;
