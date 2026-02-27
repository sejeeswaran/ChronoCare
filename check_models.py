import os
import pickle
import warnings
warnings.filterwarnings('ignore')

models = [
    'diabetes_model.pkl', 'diabetes_scaler.pkl', 
    'hypertension_model.pkl', 'hypertension_scaler.pkl', 
    'ckd_model.pkl'
]

for m in models:
    path = os.path.join('backend', 'models', m)
    if not os.path.exists(path):
        print(f'{m}: MISSING FILE')
        continue
        
    try:
        with open(path, 'rb') as f:
            obj = pickle.load(f)
        print(f'{m}: LOADED {type(obj).__name__}')
        if type(obj).__name__ in ['RandomForestClassifier', 'LogisticRegression']:
            if hasattr(obj, "feature_names_in_"):
                print(f'  -> Features (len={len(obj.feature_names_in_)}): {list(obj.feature_names_in_)}')
    except Exception as e:
        print(f'{m}: ERROR {type(e).__name__} - {str(e)}')
