import SidebarItem from "./SidebarItem";

export default function SidebarGroup({ title, items = [] }) {
    if (!items.length) return null;

    return (
        <div className="mb-4">
            <div className="px-3 py-2 text-xs text-slate-500 uppercase tracking-wider">
                {title}
            </div>

            <div className="flex flex-col gap-1">
                {items.map((item) => (
                    <SidebarItem key={item.to || item.label} {...item} />
                ))}
            </div>
        </div>
    );
}
