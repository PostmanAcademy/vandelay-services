python -m venv .venv
call .venv\Scripts\activate
pip install build
python -m build --outdir dist ..\
pip install dist\postman_custedu-1.0.0-py3-none-any.whl --force-reinstall
