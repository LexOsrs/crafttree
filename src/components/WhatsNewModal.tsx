import { CHANGELOG } from "../data/changelog";

interface WhatsNewModalProps {
  onClose: () => void;
}

export default function WhatsNewModal({ onClose }: WhatsNewModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-[calc(100vw-2rem)] sm:w-[420px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-100">What's New</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none px-1"
          >
            x
          </button>
        </div>

        <div className="p-4 space-y-5 text-sm text-gray-300">
          {CHANGELOG.map((entry) => (
            <section key={entry.date}>
              <h3 className="text-[10px] uppercase tracking-wider text-amber-400 mb-2">
                {entry.date}
              </h3>
              <ul className="space-y-1.5 list-disc list-outside pl-4 text-gray-400 leading-relaxed">
                {entry.changes.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
