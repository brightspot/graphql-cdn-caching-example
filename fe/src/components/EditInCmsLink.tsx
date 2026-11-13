const CMS_URL = (import.meta.env.VITE_CMS_URL ?? 'http://localhost/cms').replace(/\/$/, '');

// Debug aid, shown only by the dev server so production builds never link visitors to the CMS.
export default function EditInCmsLink({ id }: { id?: string | null }) {
  if (!import.meta.env.DEV || !id) {
    return null;
  }

  return (
    <a
      className="edit-link"
      href={`${CMS_URL}/content/edit.jsp?id=${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
    >
      <span aria-hidden="true">✎</span> Edit in CMS
    </a>
  );
}
