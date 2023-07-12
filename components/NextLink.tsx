

export default function NextLink({ href, text }: { href: string, text: string; }) {
    return (
        <a href={href} className="p-4 bg-green-600 hover:brightness-90 active:brightness-75 rounded-lg">
            {text}
        </a>
    );
}