/**
 * TODO: 課程規劃頁面 - 需要重新設計
 * 
 * 計劃改動：
 * 1. 整合 topicTemplate 管理功能
 * 2. 支援課程模板的建立、編輯、複製和共編
 * 3. 與新的 Supabase 資料架構整合
 * 4. 改進 UI/UX 設計
 * 
 * 目前狀態：未完整，等待重新設計
 */

import React, { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import CurriculumPlanner from '../../components/curriculum/CurriculumPlanner';
import LearningMap from '../../components/curriculum/LearningMap';
import { useCurriculum } from '../../context/CurriculumContext';

const MentorCurriculum: React.FC = () => {
  const { nodes, setNodes } = useCurriculum();

  return (
    <PageLayout title="教學規劃與任務管理">
      <div className="space-y-6">
        <CurriculumPlanner />
        <LearningMap 
          nodes={nodes} 
          onNodesChange={setNodes}
          isEditable={true}
          allowDragOut={false}
        />
      </div>
    </PageLayout>
  );
};

export default MentorCurriculum;