import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PageRef {
  pageId: string;
  title: string;
}

interface Cluster {
  label: string;
  keywords: string[];
  pageRefs: PageRef[];
}

interface TopKeyword {
  keyword: string;
  count: number;
}

export interface ClusterResult {
  meta: {
    totalPages: number;
    totalKeywords: number;
  };
  clusters: Cluster[];
  topKeywords: TopKeyword[];
}

interface ClusterResultPanelProps {
  data: ClusterResult;
}

export const ClusterResultPanel: React.FC<ClusterResultPanelProps> = ({
  data,
}) => {
  const [expandedClusters, setExpandedClusters] = useState<Set<number>>(
    new Set(data.clusters.map((_, i) => i))
  );

  const toggleCluster = (index: number) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Meta Information */}
      <div className="flex gap-6 text-sm text-gray-600">
        <div>
          <span className="font-medium">분석된 페이지:</span>{" "}
          <span className="text-gray-900">{data.meta.totalPages}개</span>
        </div>
        <div>
          <span className="font-medium">총 키워드:</span>{" "}
          <span className="text-gray-900">{data.meta.totalKeywords}개</span>
        </div>
      </div>

      {/* Clusters */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900">클러스터</h3>
        {data.clusters.map((cluster, index) => {
          const isExpanded = expandedClusters.has(index);
          return (
            <div
              key={index}
              className="border border-gray-200 rounded-md overflow-hidden"
            >
              {/* Cluster Header */}
              <button
                onClick={() => toggleCluster(index)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  {cluster.label}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Cluster Content */}
              {isExpanded && (
                <div className="p-4 bg-white flex flex-col gap-3">
                  {/* Keywords */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      키워드
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Page References */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      관련 페이지
                    </h4>
                    <ul className="flex flex-col gap-1">
                      {cluster.pageRefs.map((ref) => (
                        <li key={ref.pageId} className="text-sm text-gray-600">
                          • {ref.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top Keywords */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-gray-900">빈도 높은 키워드</h3>
        <div className="flex flex-wrap gap-3">
          {data.topKeywords.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-md"
            >
              <span className="font-medium text-purple-900">{item.keyword}</span>
              <span className="text-sm text-purple-600">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
